"""ORM real + Mongo local. Entrada JSON por stdin; nunca imprimir passwords."""
import json
import os
import re
import sys
from datetime import datetime, timezone
from decimal import Decimal

import django

django.setup()

from django.conf import settings
from django.db import transaction
from django.db.models import Avg
from apps.users.models import User
from apps.projects.models import Project
from apps.postulations.models import Postulation
from apps.rating.models import Rating
from apps.reports.mongodb import reports_collection
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken


def guard():
    if (os.environ.get("E2E_ISOLATED") != "juniorbridge_e2e"
            or settings.DATABASES["default"]["HOST"] != "postgres"
            or settings.DATABASES["default"]["NAME"] != "juniorbridge_e2e"
            or settings.MONGODB_URI != "mongodb://mongodb:27017/"
            or settings.MONGODB_DATABASE != "juniorbridge_e2e"
            or not os.environ.get("E2E_STACK", "").startswith("juniorbridge-e2e-")):
        raise RuntimeError("Entorno E2E no verificado")


def owned_users(run):
    return User.objects.filter(email__endswith=f".{run.lower()}@example.test")


def cleanup(run):
    users = owned_users(run)
    projects = Project.objects.filter(client__in=users, title__startswith=run)
    posts = Postulation.objects.filter(id_project__in=projects)
    # Incluye reportes creados por UI, delimitados por postulación Y título.
    mongo = reports_collection.delete_many({
        "id_postulation": {"$in": list(posts.values_list("pk", flat=True))},
        "title": {"$regex": "^" + re.escape(run)},
    })
    with transaction.atomic():
        projects.delete()  # Cascade: postulations, ratings, notifications, audits.
        OutstandingToken.objects.filter(user__in=users).delete()
        users.delete()
    return {"mongo_deleted": mongo.deleted_count,
            "users_remaining": owned_users(run).count(),
            "projects_remaining": Project.objects.filter(title__startswith=run).count(),
            "mongo_remaining": reports_collection.count_documents({"title": {"$regex": "^" + re.escape(run)}})}


def seed(run, password):
    try:
        with transaction.atomic():
            users = {}
            for key, role in [("client", "CLIENT"), ("tester", "TESTER"),
                              ("admin", "ADMIN"), ("outsider", "TESTER"),
                              ("empty", "TESTER"), ("otherClient", "CLIENT")]:
                users[key] = User.objects.create_user(
                    email=f"{key.lower()}.{run.lower()}@example.test",
                    password=password, name=f"{role}_E2E", surname=run,
                    role=role, is_staff=role == "ADMIN", is_superuser=role == "ADMIN",
                )

            def project(suffix, client, tester, state="IN_PROGRESS"):
                p = Project.objects.create(title=f"{run}_{suffix}",
                    description="Proyecto ficticio para E2E local", repository="https://example.test/repo",
                    demo_url="https://example.test/demo", technologies="TypeScript, Django",
                    modality="REMOTE", state=state, client=client)
                post = Postulation.objects.create(id_project=p, id_tester=tester, status="accepted")
                return p, post

            p, post = project("principal", users["client"], users["tester"])
            other, other_post = project("ajeno", users["otherClient"], users["outsider"])
            previous, previous_post = project("previo", users["client"], users["tester"], "COMPLETED")
            Rating.objects.create(id_postulation=previous_post, stars=2, comment=f"{run}_previa")
            users["tester"].reputation = Decimal("2.00")
            users["tester"].save(update_fields=["reputation"])

        def report(title, postulation, day, severity):
            doc = dict(title=f"{run}_{title}", id_postulation=postulation.pk,
                       description='Descripción con acentos, ñ, "comillas"; café & crédito.',
                       severity=severity, state="PENDING",
                       steps_to_reproduce=["Abrir sesión", "Pulsar botón; observar error"],
                       evidence_images=[], created_at=datetime.fromisoformat(day + "T12:34:56+00:00"))
            doc["_id"] = str(reports_collection.insert_one(doc.copy()).inserted_id)
            doc["created_at"] = doc["created_at"].isoformat()
            return doc

        reports = [report("filtro_café_ñ", post, "2026-01-10", "high"),
                   report("otro_crédito", post, "2026-02-11", "medium")]
        foreign = report("PRIVADO_AJENO", other_post, "2026-01-10", "low")
        return dict(run=run, users={k: dict(id=v.pk, email=v.email) for k, v in users.items()},
                    project=dict(id=p.pk, title=p.title), postulationId=post.pk,
                    foreignProjectId=other.pk, foreignPostulationId=other_post.pk,
                    previousProjectId=previous.pk, reports=reports, foreignReport=foreign)
    except Exception:
        cleanup(run)
        raise


def snapshot(run):
    users = owned_users(run)
    projects = Project.objects.filter(client__in=users, title__startswith=run)
    posts = Postulation.objects.filter(id_project__in=projects)
    reports = list(reports_collection.find({"id_postulation": {"$in": list(posts.values_list("pk", flat=True))},
                                           "title": {"$regex": "^" + re.escape(run)}}))
    for report in reports:
        report["_id"] = str(report["_id"])
        for field in ["created_at", "updated_at"]:
            if isinstance(report.get(field), datetime):
                report[field] = report[field].isoformat()
    tester = users.get(role="TESTER", email__startswith="tester.")
    ratings = Rating.objects.filter(id_postulation__in=posts)
    average = Rating.objects.filter(id_postulation__id_tester=tester,
                                    id_postulation__id_project__state="COMPLETED").aggregate(value=Avg("stars"))["value"]
    return dict(projects=list(projects.values("id", "state", "finalized_at")), reports=reports,
                ratings=list(ratings.values("id_rating", "id_postulation", "stars", "comment")),
                testerReputation=str(tester.reputation), expectedReputation=round(average or 0, 2))


guard()
payload = json.load(sys.stdin)
action = sys.argv[1]
if action == "guard":
    result = {"stack": os.environ["E2E_STACK"], "postgres": "juniorbridge_e2e", "mongodb": "juniorbridge_e2e"}
else:
    run = payload["run"]
    if not re.fullmatch(r"E2E_JUNIORBRIDGE_[a-f0-9]{16}", run):
        raise ValueError("Identificador E2E inválido")
    if action == "seed":
        result = seed(run, payload["password"])
    elif action == "cleanup":
        result = cleanup(run)
    elif action == "snapshot":
        result = snapshot(run)
    elif action == "remove_reports":
        posts = Postulation.objects.filter(id_tester__in=owned_users(run),
                                           id_project__title__startswith=run)
        result = {"deleted": reports_collection.delete_many({
            "id_postulation": {"$in": list(posts.values_list("pk", flat=True))},
            "title": {"$regex": "^" + re.escape(run)},
        }).deleted_count}
    else:
        raise ValueError("Acción no admitida")
print("E2E_JSON:" + json.dumps(result, default=str, ensure_ascii=False))

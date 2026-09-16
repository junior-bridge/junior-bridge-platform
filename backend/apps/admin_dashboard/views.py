from datetime import datetime, timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.mongodb import reports_collection
from apps.projects.models import Project
from apps.users.models import User


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # ---------------------------------------------------------
        # USUARIOS
        # ---------------------------------------------------------

        registered_users = User.objects.count()

        active_testers = User.objects.filter(
            role=User.Role.TESTER,
            is_active=True,
        ).count()

        role_distribution = {
            "testers": User.objects.filter(
                role=User.Role.TESTER
            ).count(),

            "clients": User.objects.filter(
                role=User.Role.CLIENT
            ).count(),

            "admins": User.objects.filter(
                role=User.Role.ADMIN
            ).count(),
        }

        # ---------------------------------------------------------
        # PROYECTOS
        # ---------------------------------------------------------

        active_projects = Project.objects.filter(
            state__in=[
                "OPEN",
                "IN_PROGRESS",
                "IN_REVIEW",
            ]
        ).count()

        # ---------------------------------------------------------
        # REPORTES / BUGS
        # ---------------------------------------------------------

        reported_bugs = reports_collection.count_documents({})

        resolved_bugs = reports_collection.count_documents({
            "state": "RESOLVED"
        })

        if reported_bugs > 0:
            resolution_rate = round(
                (resolved_bugs / reported_bugs) * 100
            )
        else:
            resolution_rate = 0

        # ---------------------------------------------------------
        # BUGS REPORTADOS POR MES
        # Últimos 6 meses
        # ---------------------------------------------------------

        now = datetime.now(timezone.utc)

        months = []

        year = now.year
        month = now.month

        for _ in range(6):
            months.append({
                "year": year,
                "month": month,
            })

            month -= 1

            if month == 0:
                month = 12
                year -= 1

        months.reverse()

        month_names = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
        ]

        bugs_by_month = []

        for item in months:

            start_date = datetime(
                item["year"],
                item["month"],
                1,
                tzinfo=timezone.utc,
            )

            if item["month"] == 12:
                end_date = datetime(
                    item["year"] + 1,
                    1,
                    1,
                    tzinfo=timezone.utc,
                )
            else:
                end_date = datetime(
                    item["year"],
                    item["month"] + 1,
                    1,
                    tzinfo=timezone.utc,
                )

            count = reports_collection.count_documents({
                "created_at": {
                    "$gte": start_date,
                    "$lt": end_date,
                }
            })

            bugs_by_month.append({
                "month": month_names[item["month"] - 1],
                "year": item["year"],
                "bugs": count,
            })

        # ---------------------------------------------------------
        # TOP TESTERS
        # ---------------------------------------------------------

        top_testers_queryset = User.objects.filter(
            role=User.Role.TESTER,
            is_active=True,
        ).order_by("-reputation")[:3]

        top_testers = []

        for index, tester in enumerate(top_testers_queryset, start=1):

            top_testers.append({
                "rank": index,
                "id": tester.id,
                "name": f"{tester.name} {tester.surname}",
                "reputation": float(tester.reputation),
            })

        # ---------------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------------

        stats = {
            # Cards
            "registered_users": registered_users,
            "active_projects": active_projects,
            "reported_bugs": reported_bugs,
            "active_testers": active_testers,

            # Estadísticas
            "resolved_bugs": resolved_bugs,
            "resolution_rate": resolution_rate,

            # Gráfico
            "bugs_by_month": bugs_by_month,

            # Roles
            "role_distribution": role_distribution,

            # Ranking
            "top_testers": top_testers,
        }

        return Response(stats)
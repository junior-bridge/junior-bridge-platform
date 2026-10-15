"""Report visibility and filters shared by the list and file exports."""

from django.db.models import Q

from apps.postulations.models import Postulation
from apps.users.models import User
from .mongodb import reports_collection


SEVERITY_LABELS = {"low": "BAJA", "medium": "MEDIA", "high": "ALTA"}
STATUS_LABELS = {"PENDING": "ABIERTO", "REVIEW": "EN REVISIÓN", "CLOSED": "RESUELTO"}


def authorized_reports(user):
    if user.role == User.Role.ADMIN:
        return reports_collection.find({})

    postulation_ids = list(Postulation.objects.filter(
        Q(id_tester=user) | Q(id_project__client=user)
    ).values_list("id_postulation", flat=True))
    if not postulation_ids:
        return []
    return reports_collection.find({"id_postulation": {"$in": postulation_ids}})


def matches_report_filters(report, query="", date=""):
    """Match useDashboardReports, including whitespace and the ISO/UTC day."""
    severity = report.get("severity", "")
    state = report.get("state")
    severity_label = SEVERITY_LABELS.get(severity, severity)
    status_label = STATUS_LABELS.get(state if state is not None else "PENDING", state or "")
    term = query.lower()
    matches_text = any(term in str(value).lower() for value in (
        report.get("title", ""), report.get("description", ""),
        severity_label, status_label, report.get("id_postulation", ""),
    ))
    return matches_text and (not date or (report.get("created_at") or "")[:10] == date)

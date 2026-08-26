from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reports.mongodb import reports_collection
from apps.projects.models import Project
from apps.users.models import User


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = {
            "registered_users": User.objects.count(),
            "active_projects": Project.objects.filter(
                state__in=["OPEN", "IN_PROGRESS", "IN_REVIEW"]
            ).count(),
            "reported_bugs": reports_collection.count_documents({}),
            "active_testers": User.objects.filter(
                role=User.Role.TESTER,
                is_active=True,
            ).count(),
        }

        return Response(stats)

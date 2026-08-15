from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from .models import Postulation
from .serializers import PostulationSerializer


class ProjectPostulationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id_project):
        try:
            project = Project.objects.get(pk=id_project)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != "Tester":
            return Response(
                {"detail": "Only testers can apply to projects."},
                status=status.HTTP_403_FORBIDDEN
            )

        if Postulation.objects.filter(
            id_project=project,
            id_tester=request.user
        ).exists():
            return Response(
                {"detail": "You are already applied to this project."},
                status=status.HTTP_400_BAD_REQUEST
            )

        postulation = Postulation.objects.create(
            id_project=project,
            id_tester=request.user
        )

        serializer = PostulationSerializer(postulation)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
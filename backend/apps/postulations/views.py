from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from apps.users.models import User
from .models import Postulation
from .serializers import PostulationSerializer


class ProjectPostulationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id_project):
        try:
            project = Project.objects.get(pk=id_project)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user != project.client and request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to view these postulations."},
                status=status.HTTP_403_FORBIDDEN
            )

        postulations = Postulation.objects.filter(id_project=project)
        serializer = PostulationSerializer(postulations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, id_project):
        try:
            project = Project.objects.get(pk=id_project)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != User.Role.TESTER:
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


class PostulationAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id_postulation):
        try:
            postulation = Postulation.objects.get(pk=id_postulation)
        except Postulation.DoesNotExist:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user != postulation.id_project.client:
            return Response(
                {"detail": "Only the client project owner can accept postulations."},
                status=status.HTTP_403_FORBIDDEN
            )

        postulation.status = Postulation.State.ACCEPTED
        postulation.save()

        serializer = PostulationSerializer(postulation)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class PostulationRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id_postulation):
        try:
            postulation = Postulation.objects.get(pk=id_postulation)
        except Postulation.DoesNotExist:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user != postulation.id_project.client:
            return Response(
                {"detail": "Only the client project owner can reject postulations."},
                status=status.HTTP_403_FORBIDDEN
            )

        postulation.status = Postulation.State.REJECTED
        postulation.save()

        serializer = PostulationSerializer(postulation)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class UserPostulationsListView(generics.ListAPIView):
    serializer_class = PostulationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Postulation.objects.filter(
            id_tester=self.request.user
        ).order_by('-postulation_date')

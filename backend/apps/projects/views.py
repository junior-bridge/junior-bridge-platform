from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import OpenApiResponse, extend_schema

from apps.users.permissions import IsAdmin, IsClient

from .models import Project
from .serializers import (
    PendingProjectSerializer,
    ProjectSerializer,
    ProjectStatusSerializer,
)


@extend_schema(tags=['Projects'])
class ProjectCreateView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsClient]

    @extend_schema(
        summary="Create Project",
        description="Create a new project. Only clients can create projects.",
        request=ProjectSerializer,
        responses={
            201: ProjectSerializer,
            400: OpenApiResponse(description="Invalid data."),
            403: OpenApiResponse(
                description="Only clients can create projects."
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)


@extend_schema(tags=['Projects'])
class PendingProjectListView(generics.ListAPIView):
    serializer_class = PendingProjectSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        summary="List pending projects",
        description=(
            "Returns projects pending administrative review. "
            "Only administrators can access this endpoint."
        ),
        responses={
            200: PendingProjectSerializer(many=True),
            403: OpenApiResponse(
                description="Only administrators can list pending projects."
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return (
            Project.objects.filter(state='PENDING')
            .select_related('client')
            .order_by('-created_at')
        )


@extend_schema(tags=['Projects'])
class ProjectStatusUpdateView(generics.UpdateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectStatusSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ['patch', 'options']

    @extend_schema(
        summary="Update Project Status",
        description=(
            "Update the status of a project. "
            "Only admins can update the status."
        ),
        request=ProjectStatusSerializer,
        responses={
            200: ProjectStatusSerializer,
            400: OpenApiResponse(description="Invalid data."),
            403: OpenApiResponse(
                description="Only admins can update the status."
            ),
        },
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    def perform_update(self, serializer):
        if self.get_object().state != 'PENDING':
            raise ValidationError(
                {'state': 'Only pending projects can be approved or rejected.'}
            )

        serializer.save()

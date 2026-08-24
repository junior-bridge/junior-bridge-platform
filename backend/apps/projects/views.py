from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import OpenApiResponse, extend_schema

from apps.users.permissions import IsAdmin, IsClient

from .models import Project
from .serializers import (
    AdminProjectSerializer,
    ProjectSerializer,
    ProjectStatusSerializer,
)


@extend_schema(tags=['Projects'])
class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.select_related('client').order_by('-created_at')
    serializer_class = ProjectSerializer

    def get_permissions(self):
        role_permission = IsAdmin if self.request.method == 'GET' else IsClient
        return [IsAuthenticated(), role_permission()]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminProjectSerializer

        return ProjectSerializer

    @extend_schema(
        summary="List projects",
        description=(
            "Returns all projects ordered from newest to oldest. "
            "Only administrators can access this endpoint."
        ),
        responses={
            200: AdminProjectSerializer(many=True),
            403: OpenApiResponse(
                description="Only administrators can list projects."
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

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

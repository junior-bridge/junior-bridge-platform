from rest_framework import generics, serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)

from apps.users.permissions import IsAdmin, IsClient

from .models import Project
from .pagespeed import run_project_audit
from apps.users.models import User
from .permissions import IsProjectOwner
from .serializers import (
    AdminProjectSerializer,
    ProjectAuditRequestSerializer,
    ProjectAuditSerializer,
    ProjectSerializer,
    ProjectStatusSerializer,
)


@extend_schema(tags=['Projects'])
class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.select_related('client').order_by('-created_at')
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsClient()]
        return [IsAuthenticated()]

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


@extend_schema(
    tags=['Projects'],
    summary="List My Projects",
    description="List the projects owned by the authenticated client, newest first.",
)
class UserProjectsListView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(client=self.request.user).order_by('-created_at')

@extend_schema_view(
    put=extend_schema(
        summary="Update project",
        description="Replace a PENDING project. Only its owner (or an admin) can update it.",
    ),
    patch=extend_schema(
        summary="Partially update project",
        description="Partially update a PENDING project. Only its owner (or an admin) can update it.",
    ),
    delete=extend_schema(
        summary="Delete project",
        description="Delete a PENDING project. Only its owner (or an admin) can delete it.",
    ),
)
@extend_schema(tags=['Projects'])
class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.select_related('client')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_permissions(self):
        return [IsAuthenticated(), IsProjectOwner()]

    @extend_schema(
        summary="Get project detail",
        description=(
            "Returns a project owned by the authenticated client "
            "or any project for an administrator."
        ),
        responses={
            200: ProjectSerializer,
            403: OpenApiResponse(description="You do not have access to this project."),
            404: OpenApiResponse(description="Project not found."),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def perform_update(self, serializer):
        if self.get_object().state != 'PENDING':
            raise ValidationError(
                {'state': 'Only pending projects can be updated.'}
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.state != 'PENDING':
            raise ValidationError(
                {'state': 'Only pending projects can be deleted.'}
            )

        instance.delete()

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

@extend_schema(tags=['Projects'])
class ProjectFinishDeliveryView(generics.GenericAPIView):
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]
    http_method_names = ['post', 'options']

    @extend_schema(
        summary="Finish Project Delivery",
        description=(
            "Move an IN_PROGRESS project to IN_REVIEW. "
            "Only the tester with the accepted postulation can finish the delivery. "
            "No request body is required."
        ),
        request=None,
        responses={
            200: inline_serializer(
                name='ProjectFinishDeliveryResponse',
                fields={
                    'detail': serializers.CharField(),
                    'state': serializers.CharField(),
                },
            ),
            400: OpenApiResponse(
                description="Only projects in progress can have their delivery finished."
            ),
            403: OpenApiResponse(
                description="Only the assigned tester can finish the delivery."
            ),
            404: OpenApiResponse(description="Project not found."),
        },
    )
    def post(self, request, pk):
        project = self.get_object()

        if request.user.role != User.Role.TESTER:
            return Response(
                {"detail": "Only the assigned tester can finish the delivery."},
                status=status.HTTP_403_FORBIDDEN
            )

        postulation = project.postulations.filter(
            id_tester=request.user,
            status="accepted"
        ).first()

        if postulation is None:
            return Response(
                {"detail": "You are not the assigned tester for this project."},
                status=status.HTTP_403_FORBIDDEN
            )

        if project.state != "IN_PROGRESS":
            return Response(
                {"detail": "Only projects in progress can have their delivery finished."},
                status=status.HTTP_400_BAD_REQUEST
            )

        project.state = "IN_REVIEW"
        project.save(update_fields=["state"])

        return Response(
            {"detail": "Delivery finished successfully.", "state": project.state},
            status=status.HTTP_200_OK
        )

@extend_schema(tags=['Projects'])
class ProjectCompleteView(generics.GenericAPIView):
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]
    http_method_names = ['post', 'options']

    @extend_schema(
        summary="Complete Project",
        description=(
            "Mark an IN_PROGRESS or IN_REVIEW project as COMPLETED and set its "
            "finalization date. Only the project owner can complete it. "
            "No request body is required."
        ),
        request=None,
        responses={
            200: inline_serializer(
                name='ProjectCompleteResponse',
                fields={
                    'detail': serializers.CharField(),
                    'state': serializers.CharField(),
                    'finalized_at': serializers.DateTimeField(),
                },
            ),
            400: OpenApiResponse(
                description="Only projects in progress or under review can be completed."
            ),
            403: OpenApiResponse(
                description="Only the project owner can complete the project."
            ),
            404: OpenApiResponse(description="Project not found."),
        },
    )
    def post(self, request, pk):
        project = self.get_object()

        if request.user != project.client:
            return Response(
                {"detail": "Only the project owner can complete the project."},
                status=status.HTTP_403_FORBIDDEN
            )

        if project.state not in ["IN_PROGRESS", "IN_REVIEW"]:
            return Response(
                {
                    "detail": (
                        "Only projects in progress or under review "
                        "can be completed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        project.state = "COMPLETED"
        project.finalized_at = timezone.now()
        project.save(update_fields=["state", "finalized_at"])

        return Response(
            {
                "detail": "Project completed successfully.",
                "state": project.state,
                "finalized_at": project.finalized_at,
            },
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Projects'])
class ProjectAuditView(generics.GenericAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectAuditSerializer
    http_method_names = ['get', 'post', 'options']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsProjectOwner()]
        return [IsAuthenticated()]

    @extend_schema(
        summary="Get latest PageSpeed audit",
        description=(
            "Returns the most recent PageSpeed Insights audit of the "
            "project's demo URL. Available to any authenticated user."
        ),
        responses={
            200: ProjectAuditSerializer,
            404: OpenApiResponse(description="Project or audit not found."),
        },
    )
    def get(self, request, pk):
        project = self.get_object()
        audit = project.audits.first()

        if audit is None:
            return Response(
                {"detail": "Este proyecto aún no tiene auditorías."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(ProjectAuditSerializer(audit).data)

    @extend_schema(
        summary="Run PageSpeed audit",
        description=(
            "Runs a Google PageSpeed Insights audit of the project's demo URL "
            "and stores the result. Only the project owner or an admin can "
            "run it."
        ),
        request=ProjectAuditRequestSerializer,
        responses={
            201: ProjectAuditSerializer,
            400: OpenApiResponse(description="Invalid strategy."),
            403: OpenApiResponse(
                description="Only the project owner or an admin can run audits."
            ),
            404: OpenApiResponse(description="Project not found."),
            502: ProjectAuditSerializer,
        },
    )
    def post(self, request, pk):
        project = self.get_object()

        request_serializer = ProjectAuditRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        audit = run_project_audit(
            project,
            request.user,
            request_serializer.validated_data['strategy'],
        )

        response_status = (
            status.HTTP_201_CREATED
            if audit.status == audit.Status.SUCCESS
            else status.HTTP_502_BAD_GATEWAY
        )
        return Response(ProjectAuditSerializer(audit).data, status=response_status)

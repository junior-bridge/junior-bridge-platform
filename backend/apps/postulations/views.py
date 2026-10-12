from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import OpenApiResponse, extend_schema

from apps.projects.models import Project
from apps.users.models import User
from .models import Postulation
from .serializers import PostulationSerializer


@extend_schema(tags=['Postulations'])
class ProjectPostulationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Project Postulations",
        description=(
            "List all postulations of a project. "
            "Only the project owner or an admin can view them."
        ),
        responses={
            200: PostulationSerializer(many=True),
            403: OpenApiResponse(
                description="Only the project owner or an admin can view the postulations."
            ),
            404: OpenApiResponse(description="Project not found."),
        },
    )
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

    @extend_schema(
        summary="Apply To Project",
        description=(
            "Create a postulation of the authenticated tester to an open project. "
            "No request body is required."
        ),
        request=None,
        responses={
            201: PostulationSerializer,
            400: OpenApiResponse(
                description="The project is not open or the tester already applied."
            ),
            403: OpenApiResponse(description="Only testers can apply to projects."),
            404: OpenApiResponse(description="Project not found."),
        },
    )
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

        if project.state != "OPEN":
            return Response(
                {"detail": "You can only apply to open projects."},
                status=status.HTTP_400_BAD_REQUEST
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


@extend_schema(tags=['Postulations'])
class PostulationAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Accept Postulation",
        description=(
            "Accept a pending postulation and move its project to IN_PROGRESS. "
            "Only the project owner can accept postulations."
        ),
        request=None,
        responses={
            200: PostulationSerializer,
            400: OpenApiResponse(
                description="Only pending postulations can be accepted."
            ),
            403: OpenApiResponse(
                description="Only the client project owner can accept postulations."
            ),
            404: OpenApiResponse(description="Postulation not found."),
        },
    )
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

        if postulation.status != Postulation.State.PENDING:
            return Response(
                {"detail": "Only pending postulations can be accepted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        postulation.status = Postulation.State.ACCEPTED
        postulation.save()

        project = postulation.id_project
        project.state = "IN_PROGRESS"
        project.save(update_fields=["state"])

        serializer = PostulationSerializer(postulation)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Postulations'])
class PostulationRejectView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Reject Postulation",
        description=(
            "Reject a pending postulation. "
            "Only the project owner can reject postulations."
        ),
        request=None,
        responses={
            200: PostulationSerializer,
            400: OpenApiResponse(
                description="Only pending postulations can be rejected."
            ),
            403: OpenApiResponse(
                description="Only the client project owner can reject postulations."
            ),
            404: OpenApiResponse(description="Postulation not found."),
        },
    )
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

        if postulation.status != Postulation.State.PENDING:
            return Response(
                {"detail": "Only pending postulations can be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        postulation.status = Postulation.State.REJECTED
        postulation.save()

        serializer = PostulationSerializer(postulation)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Postulations'])
class PostulationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_postulation(self, id_postulation):
        try:
            return Postulation.objects.select_related(
                'id_project',
                'id_tester',
            ).get(pk=id_postulation)
        except Postulation.DoesNotExist:
            return None

    @extend_schema(
        summary="Retrieve Postulation",
        description=(
            "Retrieve a postulation. Visible to its tester, "
            "the project owner and admins."
        ),
        responses={
            200: PostulationSerializer,
            403: OpenApiResponse(
                description="You do not have permission to view this postulation."
            ),
            404: OpenApiResponse(description="Postulation not found."),
        },
    )
    def get(self, request, id_postulation):
        postulation = self.get_postulation(id_postulation)

        if postulation is None:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        can_view = (
            request.user == postulation.id_tester
            or request.user == postulation.id_project.client
            or request.user.role == User.Role.ADMIN
        )

        if not can_view:
            return Response(
                {"detail": "You do not have permission to view this postulation."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PostulationSerializer(postulation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Withdraw Postulation",
        description=(
            "Delete a pending postulation. "
            "Only the tester who applied can withdraw it."
        ),
        responses={
            204: OpenApiResponse(description="Postulation withdrawn."),
            400: OpenApiResponse(
                description="Only pending postulations can be withdrawn."
            ),
            403: OpenApiResponse(
                description="Only the tester can withdraw this postulation."
            ),
            404: OpenApiResponse(description="Postulation not found."),
        },
    )
    def delete(self, request, id_postulation):
        postulation = self.get_postulation(id_postulation)

        if postulation is None:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user != postulation.id_tester:
            return Response(
                {"detail": "Only the tester can withdraw this postulation."},
                status=status.HTTP_403_FORBIDDEN
            )

        if postulation.status != Postulation.State.PENDING:
            return Response(
                {"detail": "Only pending postulations can be withdrawn."},
                status=status.HTTP_400_BAD_REQUEST
            )

        postulation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=['Postulations'],
    summary="List My Postulations",
    description="List the postulations of the authenticated tester, newest first.",
)
class UserPostulationsListView(generics.ListAPIView):
    serializer_class = PostulationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Postulation.objects.filter(
            id_tester=self.request.user
        ).order_by('-postulation_date')

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from .models import Postulation
from .serializers import PostulationSerializer

from drf_spectacular.utils import extend_schema, OpenApiResponse
@extend_schema(tags=['Postulations'])


class ProjectPostulationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Create Postulations",
        description="Allow testers to apply to a project. Only testers can apply, and they cannot apply to the same project more than once.",
        responses={
            201: PostulationSerializer,
            400: OpenApiResponse(
                description="Tester already applied to this project."
            ),
            403: OpenApiResponse(
                description="Only testers can apply to projects."
            ),
            404: OpenApiResponse(
                description="Proyect not found"
            ),
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
        if request.user.role not in ("Tester", "TESTER"):
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

@extend_schema(tags=['Postulations'])
class PostulationAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Accept Postulation",
        description="Allow owner to accept a postulation.",
        responses={
            200: PostulationSerializer,
            403: OpenApiResponse(
                description="User is not the owner of the project."
            ),
            404: OpenApiResponse(
                description="Postuation not found"
            ),
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

        postulation.status = Postulation.State.ACCEPTED
        postulation.save()

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
        description="Allow owner to reject a postulation.",
        responses={
            200: PostulationSerializer,
            403: OpenApiResponse(
                description="User is not the owner of the project."
            ),
            404: OpenApiResponse(
                description="Postulation not found."
            ),
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

        postulation.status = Postulation.State.REJECTED
        postulation.save()

        serializer = PostulationSerializer(postulation)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
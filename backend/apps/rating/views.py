from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.postulations.models import Postulation

from .models import Rating
from .serializers import RatingSerializer

from drf_spectacular.utils import extend_schema, OpenApiResponse


@extend_schema(tags=['Rating'])
class PostulationRatingView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get rating by postulation",
        description="Get the rating of a postulation by its id.",
        responses={
            200: RatingSerializer,
            404: OpenApiResponse(
                description="Rating not found."
            ),
        },
    )
    def get(self, request, id_postulation):
        try:
            postulation = Postulation.objects.get(
                pk=id_postulation
            )
        except Postulation.DoesNotExist:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            rating = Rating.objects.get(
                id_postulation=postulation
            )
        except Rating.DoesNotExist:
            return Response(
                {"detail": "Rating not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = RatingSerializer(rating)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Create rating for postulation",
        description="Create rating for a postulation. A postulation can only have one rating.",
        request=RatingSerializer,
        responses={
            201: RatingSerializer,
            400: OpenApiResponse(
                description="Invalida data or postulation already has a rating."
            ),
            404: OpenApiResponse(
                description="Postulation not found."
            ),
        },
    )
    def post(self, request, id_postulation):
        try:
            postulation = Postulation.objects.get(
                pk=id_postulation
            )
        except Postulation.DoesNotExist:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if Rating.objects.filter(
            id_postulation=postulation
        ).exists():
            return Response(
                {"detail": "This postulation already has a rating."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RatingSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        rating = serializer.save(
            id_postulation=postulation
        )

        return Response(
            RatingSerializer(rating).data,
            status=status.HTTP_201_CREATED,
        )

@extend_schema(tags=['Rating'])
class RatingUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Update rating",
        description="Update an existing rating.",
        request=RatingSerializer,
        responses={
            200: RatingSerializer,
            400: OpenApiResponse(
                description="Invalid data."
            ),
            404: OpenApiResponse(
                description="Rating not found."
            ),
        },
    )
    def put(self, request, id_rating):
        try:
            rating = Rating.objects.get(
                pk=id_rating
            )
        except Rating.DoesNotExist:
            return Response(
                {"detail": "Rating not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = RatingSerializer(
            rating,
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)
        rating = serializer.save()

        return Response(
            RatingSerializer(rating).data,
            status=status.HTTP_200_OK,
        )

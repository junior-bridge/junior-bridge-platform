from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.postulations.models import Postulation

from .models import Rating
from .serializers import RatingSerializer


class PostulationRatingView(APIView):
    permission_classes = [IsAuthenticated]

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
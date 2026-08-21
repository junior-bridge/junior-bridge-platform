from django.shortcuts import render
from datetime import datetime, timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.postulations.models import Postulation

from apps.reports.serializer import ReportSerializer
from .mongodb import reports_collection
from drf_spectacular.utils import extend_schema, OpenApiResponse

@extend_schema(tags=['Reports'])
class PostulationReportCreateView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Create Report",
        description="Allow testers to create a report for an accepted postulation.",
        request=ReportSerializer,
        responses={
            201: ReportSerializer,
            400: OpenApiResponse(
                description="Only accepted postulations can create reports."
            ),
            403: OpenApiResponse(
                description="Not authorized to create a report for this postulation."
            ),
            404: OpenApiResponse(
                description="Postulation not found."
            ),
        },
    )
    def post(self, request, id_postulation):

        try:
            postulation = Postulation.objects.get(
                id_postulation=id_postulation
            )
        except Postulation.DoesNotExist:
            return Response(
                {
                    "detail": "Postulation not exists."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if postulation.status != Postulation.State.ACCEPTED:
            return Response(
                {
                    "detail": (
                        "Only accepted postulations can create reports. "
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if postulation.id_tester != request.user:
            return Response(
                {
                    "detail": (
                        "Not authorized to create a report for this postulation."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ReportSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        report_data = serializer.validated_data

        report_data["id_postulation"] = postulation.id_postulation
        report_data["created_at"] = datetime.now(timezone.utc)

        result = reports_collection.insert_one(report_data)

        report_data["_id"] = str(result.inserted_id)

        return Response(
            report_data,
            status=status.HTTP_201_CREATED
        )
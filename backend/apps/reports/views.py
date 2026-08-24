from bson import ObjectId
from django.shortcuts import render
from datetime import datetime, timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.postulations.models import Postulation

from apps.reports.serializer import ReportSerializer
from .mongodb import reports_collection
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

@extend_schema(tags=['Reports'])
class PostulationReportView(APIView):

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
    @extend_schema(
        summary="Get all reports for a postulation",
        description="Allow testers to get all reports for an accepted postulation.",
        responses={
            200: ReportSerializer,
            403: OpenApiResponse(
                description="Not authorized to view this report."
            ),
            404:OpenApiResponse(
                description="Not reports found."
            ),
        },
    )
    def get(self, request, id_postulation):
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
    
            if postulation.id_tester != request.user:
                return Response(
                    {
                        "detail": (
                            "Not authorized to view the reports."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
    
            reports = list(reports_collection.find({"id_postulation": int(id_postulation)}))
    
            if not reports:
                return Response(
                    {
                        "detail": "Not reports found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
    
            for report in reports:
                report["_id"] = str(report["_id"])
    
            return Response(reports, status=status.HTTP_200_OK)
   
@extend_schema(tags=['Reports'])
class ReportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Report",
        description="Allow testers to get a report for an accepted postulation.",
        parameters=[
            OpenApiParameter(
                name="id_report",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description="Report ObjectID from MongoDB",
            )
        ],
        responses={
            200: ReportSerializer,
            403: OpenApiResponse(
                description="Not authorized to view this report."
            ),
            404: OpenApiResponse(
                description="Report not found."
            ),
        },
    )
    def get(self, request, id_report):
        try:
            report = reports_collection.find_one({"_id": ObjectId(id_report)})
        except not report:
            return Response(
                {
                    "detail": "Report not exists."
                },
                status=status.HTTP_404_NOT_FOUND
            )
        postulation=Postulation.objects.get(id_postulation=report["id_postulation"])
        if postulation.id_tester != request.user:
            return Response(
                {
                    "detail": (
                        "Not authorized to view this report."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        report["_id"] = str(report["_id"])

        return Response(report, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update Report",
        description="Allow testers to update a report for an accepted postulation.",
         parameters=[
                    OpenApiParameter(
                        name="id_report",
                        type=OpenApiTypes.STR,
                        location=OpenApiParameter.PATH,
                        description="Report ObjectID from MongoDB",
                    )
                ],
        request=ReportSerializer,
        responses={
            200: ReportSerializer,
            400: OpenApiResponse(
                description="Invalid data."
            ),
            403: OpenApiResponse(
                description="Not authorized to update this report."
            ),
            404: OpenApiResponse(
                description="Report not found."
            ),
        },
    )
    def put(self, request, id_report):
        try:
            report = reports_collection.find_one({"_id": ObjectId(id_report)})
            if not report:
                return Response(
                    {
                        "detail": "Report not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            postulation=Postulation.objects.get(id_postulation=report["id_postulation"])
            if postulation.id_tester != request.user:
                return Response(
                    {
                        "detail": (
                            "Not authorized to update this report."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = ReportSerializer(data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            report.update(serializer.validated_data)
            reports_collection.replace_one({"_id": ObjectId(id_report)}, report)
            
            report["_id"] = str(report["_id"])
            return Response(
                report,
                status=status.HTTP_200_OK
            )
        except:
            return Response(
                {
                    "detail": "Report not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
    @extend_schema(
        summary="Delete Report",
        description="Allow testers to delete a report for an accepted postulation.",
          parameters=[
                     OpenApiParameter(
                         name="id_report",
                         type=OpenApiTypes.STR,
                         location=OpenApiParameter.PATH,
                         description="Report ObjectID from MongoDB",
                     )
                 ],
        responses={
            200: OpenApiResponse(
                description="Report deleted successfully."
            ),
            403: OpenApiResponse(
                description="Not authorized to delete this report."
            ),
            404: OpenApiResponse(
                description="Report not found."
            ),
        },
    )
    def delete(self, request, id_report):
        try:
            report = reports_collection.find_one({"_id":ObjectId(id_report)})
            if not report:
                return Response(
                    {
                        "detail": "Report not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            postulation=Postulation.objects.get(id_postulation=report["id_postulation"])
            if postulation.id_tester != request.user:
                return Response(
                    {
                        "detail": (
                            "Not authorized to delete this report."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            reports_collection.delete_one({"_id": ObjectId(id_report)})
            return Response(
                {
                    "detail": "Report deleted successfully."
                },
                status=status.HTTP_200_OK
            )
        except:
            return Response(
                {
                    "detail": "Report not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
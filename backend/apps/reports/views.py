from bson import ObjectId
from django.shortcuts import get_object_or_404
from datetime import datetime, timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.postulations.models import Postulation
from apps.reports.serializers import ReportSerializer
from .mongodb import reports_collection
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes


@extend_schema(tags=['Reports'])
class ReportListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List User Reports",
        description="Get all reports where user is either the tester or the project client.",
        responses={
            200: ReportSerializer(many=True),
        },
    )
    def get(self, request):
        user = request.user
    
        tester_postulations = Postulation.objects.filter(
            id_tester=user
        ).values_list('id_postulation', flat=True)
        
        client_postulations = Postulation.objects.filter(
            id_project__client=user
        ).values_list('id_postulation', flat=True)
        
        postulation_ids = list(tester_postulations) + list(client_postulations)
        
        if not postulation_ids:
            return Response([], status=status.HTTP_200_OK)
        
        reports = list(reports_collection.find(
            {"id_postulation": {"$in": postulation_ids}}
        ))
        
        for report in reports:
            report["_id"] = str(report["_id"])
        
        return Response(reports, status=status.HTTP_200_OK)


@extend_schema(tags=['Reports'])
class PostulationReportListCreateAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get all reports for a postulation",
        description="Get all reports for an accepted postulation.",
        responses={
            200: ReportSerializer(many=True),
            403: OpenApiResponse(description="Not authorized to view these reports."),
            404: OpenApiResponse(description="Postulation not found."),
        },
    )
    def get(self, request, postulation_id):
        try:
            postulation = Postulation.objects.get(
                id_postulation=postulation_id
            )
        except Postulation.DoesNotExist:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if (postulation.id_tester != request.user and 
            postulation.id_project.client != request.user):
            return Response(
                {"detail": "Not authorized to view these reports."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reports = list(reports_collection.find(
            {"id_postulation": postulation_id}
        ))
        
        if not reports:
            return Response([], status=status.HTTP_200_OK)
        
        for report in reports:
            report["_id"] = str(report["_id"])
        
        return Response(reports, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create Report",
        description="Allow testers to create a report for an accepted postulation.",
        request=ReportSerializer,
        responses={
            201: ReportSerializer,
            400: OpenApiResponse(description="Only accepted postulations can create reports."),
            403: OpenApiResponse(description="Not authorized to create a report."),
            404: OpenApiResponse(description="Postulation not found."),
        },
    )
    def post(self, request, postulation_id):
        try:
            postulation = Postulation.objects.get(
                id_postulation=postulation_id
            )
        except Postulation.DoesNotExist:
            return Response(
                {"detail": "Postulation not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if postulation.id_tester != request.user:
            return Response(
                {"detail": "Not authorized to create a report."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if postulation.status != Postulation.State.ACCEPTED:
            return Response(
                {"detail": "Only accepted postulations can create reports."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report_data = serializer.validated_data
        report_data["id_postulation"] = postulation_id
        report_data["created_at"] = datetime.now(timezone.utc)
        
        result = reports_collection.insert_one(report_data)
        report_data["_id"] = str(result.inserted_id)
        
        return Response(report_data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Reports'])
class ReportDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_report_or_404(self, id_report):
        try:
            report = reports_collection.find_one({"_id": ObjectId(id_report)})
            if not report:
                return None
            return report
        except:
            return None

    def _check_authorization(self, request, report):
        postulation = Postulation.objects.get(
            id_postulation=report["id_postulation"]
        )
        
        is_tester = postulation.id_tester == request.user
        is_client = postulation.id_project.client == request.user
        
        return is_tester or is_client

    @extend_schema(
        summary="Get Report",
        description="Get a specific report.",
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
            403: OpenApiResponse(description="Not authorized to view this report."),
            404: OpenApiResponse(description="Report not found."),
        },
    )
    def get(self, request, id_report):
        report = self._get_report_or_404(id_report)
        if not report:
            return Response(
                {"detail": "Report not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not self._check_authorization(request, report):
            return Response(
                {"detail": "Not authorized to view this report."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report["_id"] = str(report["_id"])
        return Response(report, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update Report",
        description="Update a specific report (only tester can update).",
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
            400: OpenApiResponse(description="Invalid data."),
            403: OpenApiResponse(description="Not authorized to update this report."),
            404: OpenApiResponse(description="Report not found."),
        },
    )
    def put(self, request, id_report):
        report = self._get_report_or_404(id_report)
        if not report:
            return Response(
                {"detail": "Report not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        postulation = Postulation.objects.get(
            id_postulation=report["id_postulation"]
        )
        
        if postulation.id_tester != request.user:
            return Response(
                {"detail": "Not authorized to update this report."},
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
        return Response(report, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete Report",
        description="Delete a specific report (only tester can delete).",
        parameters=[
            OpenApiParameter(
                name="id_report",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description="Report ObjectID from MongoDB",
            )
        ],
        responses={
            204: OpenApiResponse(description="Report deleted successfully."),
            403: OpenApiResponse(description="Not authorized to delete this report."),
            404: OpenApiResponse(description="Report not found."),
        },
    )
    def delete(self, request, id_report):
        report = self._get_report_or_404(id_report)
        if not report:
            return Response(
                {"detail": "Report not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        postulation = Postulation.objects.get(
            id_postulation=report["id_postulation"]
        )
        
        if postulation.id_tester != request.user:
            return Response(
                {"detail": "Not authorized to delete this report."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reports_collection.delete_one({"_id": ObjectId(id_report)})
        return Response(status=status.HTTP_204_NO_CONTENT)
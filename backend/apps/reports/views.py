import mimetypes
import logging
import json
from bson import ObjectId
from bson.errors import InvalidId
from django.core.files.storage import default_storage
from datetime import datetime, timezone
from django.http import FileResponse, Http404, HttpResponse
from pathlib import Path
from uuid import uuid4

from apps.image_utils import compress_uploaded_image
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.postulations.models import Postulation
from apps.reports.serializers import ReportSerializer, ReportExportQuerySerializer
from .services import authorized_reports, matches_report_filters
from .exporters import CONTENT_TYPES, ExportValidationError, export_rows, generate_csv, generate_pdf, generate_xlsx
from .mongodb import reports_collection
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

logger = logging.getLogger(__name__)
MAX_EXPORT_REPORTS = 5000
MAX_EXPORT_TEXT_SIZE = 10_000_000


def _store_evidence_images(files):
    stored_paths = []
    try:
        for file in files:
            compressed_file = compress_uploaded_image(file)
            path = default_storage.save(
                f"reports/evidence/{uuid4().hex}{Path(compressed_file.name).suffix}",
                compressed_file,
            )
            stored_paths.append(path)
    except Exception:
        for path in stored_paths:
            default_storage.delete(path)
        raise

    return stored_paths


def _serialize_report(report):
    report = report.copy()
    report["_id"] = str(report["_id"])
    return ReportSerializer(report).data


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
        return Response(
            [_serialize_report(report) for report in authorized_reports(request.user)],
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["Reports"])
class ReportExportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store, private"
        response["X-Content-Type-Options"] = "nosniff"
        return response

    @extend_schema(
        summary="Export authorized reports as CSV, PDF or XLSX",
        parameters=[ReportExportQuerySerializer],
        responses={200: OpenApiTypes.BINARY, 400: OpenApiResponse(description="Invalid parameters, empty results or export limit exceeded.")},
    )
    def get(self, request):
        params = ReportExportQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        file_format = params.validated_data["file_format"]
        query = params.validated_data["q"]
        date = params.validated_data["date"]
        reports = []
        text_size = 0
        try:
            for document in authorized_reports(request.user):
                report = _serialize_report(document)
                if not matches_report_filters(report, query, date):
                    continue
                reports.append(report)
                text_size += len(json.dumps(report, ensure_ascii=False))
                if len(reports) > MAX_EXPORT_REPORTS or text_size > MAX_EXPORT_TEXT_SIZE:
                    return Response({"detail": "La exportación es demasiado grande. Aplicá filtros y volvé a intentar."}, status=400)
            if not reports:
                return Response({"detail": "No hay reportes para exportar con los filtros seleccionados."}, status=400)

            rows = export_rows(reports)
            generated_at = datetime.now(timezone.utc)
            if file_format == "csv":
                content = generate_csv(rows)
            elif file_format == "xlsx":
                content = generate_xlsx(rows)
            else:
                content = generate_pdf(rows, query=query, date=date, generated_at=generated_at)
        except ExportValidationError as error:
            return Response({"detail": str(error)}, status=400)
        except Exception:
            logger.exception("Report export failed")
            return Response({"detail": "No se pudo generar el archivo completo. Intentá nuevamente."}, status=500)

        filename = f"reportes-juniorbridge-{generated_at:%Y%m%d-%H%M%S}.{file_format}"
        response = HttpResponse(content, content_type=CONTENT_TYPES[file_format])
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(content)
        response["X-Report-Count"] = len(reports)
        response["Access-Control-Expose-Headers"] = "Content-Disposition, X-Report-Count"
        return response


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
        
        return Response(
            [_serialize_report(report) for report in reports],
            status=status.HTTP_200_OK,
        )

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
        evidence_files = report_data.pop("evidence_images", [])
        evidence_paths = _store_evidence_images(evidence_files)
        report_data["evidence_images"] = evidence_paths
        report_data["id_postulation"] = postulation_id
        report_data["created_at"] = datetime.now(timezone.utc)

        try:
            result = reports_collection.insert_one(report_data)
        except Exception:
            for path in evidence_paths:
                default_storage.delete(path)
            raise

        report_data["_id"] = result.inserted_id
        return Response(
            _serialize_report(report_data),
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Reports'])
class ReportDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_report_or_404(self, id_report):
        try:
            report = reports_collection.find_one({"_id": ObjectId(id_report)})
            if not report:
                return None
            return report
        except (InvalidId, TypeError):
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
        
        return Response(
            _serialize_report(report),
            status=status.HTTP_200_OK,
        )

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

        evidence_files = serializer.validated_data.pop(
            "evidence_images",
            [],
        )
        existing_paths = report.get("evidence_images", [])
        if len(existing_paths) + len(evidence_files) > 5:
            return Response(
                {
                    "evidence_images": [
                        "Un reporte puede tener como máximo 5 imágenes."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        evidence_paths = _store_evidence_images(evidence_files)
        report.update(serializer.validated_data)
        if evidence_paths:
            report["evidence_images"] = existing_paths + evidence_paths

        try:
            reports_collection.replace_one(
                {"_id": ObjectId(id_report)},
                report,
            )
        except Exception:
            for path in evidence_paths:
                default_storage.delete(path)
            raise

        return Response(
            _serialize_report(report),
            status=status.HTTP_200_OK,
        )

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
        for path in report.get("evidence_images", []):
            default_storage.delete(path)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReportEvidenceAPIView(ReportDetailAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id_report, index):
        report = self._get_report_or_404(id_report)
        if not report:
            raise Http404("Report not found.")

        if not self._check_authorization(request, report):
            return Response(
                {"detail": "Not authorized to view this evidence."},
                status=status.HTTP_403_FORBIDDEN,
            )

        evidence_paths = report.get("evidence_images", [])
        if index >= len(evidence_paths):
            raise Http404("Evidence image not found.")

        path = evidence_paths[index]

        content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
        response = FileResponse(
            default_storage.open(path, "rb"),
            content_type=content_type,
        )
        response["Content-Disposition"] = "inline"
        response["X-Content-Type-Options"] = "nosniff"
        return response

from django.urls import path
from .views import (
    ReportListAPIView,
    ReportExportAPIView,
    ReportDetailAPIView,
    ReportEvidenceAPIView,
    PostulationReportListCreateAPIView,
)

urlpatterns = [
    path('', ReportListAPIView.as_view(), name='report-list'),
    path('export/', ReportExportAPIView.as_view(), name='report-export'),
    path(
        '<str:id_report>/evidence/<int:index>/',
        ReportEvidenceAPIView.as_view(),
        name='report-evidence',
    ),
    path(
        '<str:id_report>/',
        ReportDetailAPIView.as_view(),
        name='report-detail',
    ),
]

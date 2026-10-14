from django.urls import path
from .views import (
    ReportListAPIView,
    ReportDetailAPIView,
    ReportEvidenceAPIView,
    PostulationReportListCreateAPIView,
)

urlpatterns = [
    path('', ReportListAPIView.as_view(), name='report-list'),
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
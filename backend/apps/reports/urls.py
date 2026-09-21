from django.urls import path
from .views import (
    ReportListAPIView,
    ReportDetailAPIView,
    PostulationReportListCreateAPIView,
)

urlpatterns = [
    path('', ReportListAPIView.as_view(), name='report-list'),
    
    path('<int:id_report>/', ReportDetailAPIView.as_view(), name='report-detail'),
    
]
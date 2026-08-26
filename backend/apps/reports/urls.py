from django.urls import path
from .views import (
    ReportListAPIView,
    ReportDetailAPIView,
    PostulationReportListCreateAPIView,
)

urlpatterns = [
    # GET /api/reports/
    path('', ReportListAPIView.as_view(), name='report-list'),
    
    # GET, PUT, DELETE /api/reports/<id>/
    path('<int:pk>/', ReportDetailAPIView.as_view(), name='report-detail'),
    
    # POST y GET /api/reports/postulations/<postulation_id>/
    path('postulations/<int:postulation_id>/', PostulationReportListCreateAPIView.as_view(), name='postulation-reports'),
]
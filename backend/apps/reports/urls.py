from django.urls import path

from apps.reports.views import ReportView

urlpatterns = [
    path("<str:id_report>/", ReportView.as_view(), name="report"),
]
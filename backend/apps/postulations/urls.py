from django.urls import path

from apps.postulations.views import PostulationAcceptView, PostulationRejectView

from apps.rating.views import PostulationRatingView

from apps.reports.views import PostulationReportView


urlpatterns = [
    path('<int:id_postulation>/accept/', PostulationAcceptView.as_view(), name='postulation-accept'),
    path('<int:id_postulation>/reject/', PostulationRejectView.as_view(), name='postulation-reject'),
    path(
        "<int:id_postulation>/rating/",
        PostulationRatingView.as_view(),
        name="postulation-rating",
    ),
    path("<int:id_postulation>/reports/",
        PostulationReportView.as_view(),
        name="postulation-report-create")
]
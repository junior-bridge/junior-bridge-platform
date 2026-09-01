from django.urls import path

from apps.postulations.views import (
    PostulationAcceptView,
    PostulationRejectView,
    UserPostulationsListView,
)
from apps.rating.views import PostulationRatingView
from apps.reports.views import PostulationReportListCreateAPIView 

urlpatterns = [
    path('user-active/', UserPostulationsListView.as_view(), name='postulation-user-active'),
    path('<int:id_postulation>/accept/', PostulationAcceptView.as_view(), name='postulation-accept'),
    path('<int:id_postulation>/reject/', PostulationRejectView.as_view(), name='postulation-reject'),
    path(
        "<int:id_postulation>/rating/",
        PostulationRatingView.as_view(),
        name="postulation-rating",
    ),
    
    path(
        "<int:postulation_id>/reports/",
        PostulationReportListCreateAPIView.as_view(),
        name="postulation-reports",
    ),
]
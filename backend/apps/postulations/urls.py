from django.urls import path

from apps.rating.views import PostulationRatingView


urlpatterns = [
    path(
        "<int:id_postulation>/rating/",
        PostulationRatingView.as_view(),
        name="postulation-rating",
    ),
]
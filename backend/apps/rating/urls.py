from django.urls import path

from .views import RatingUpdateView


urlpatterns = [
    path(
        "<int:id_rating>/",
        RatingUpdateView.as_view(),
        name="rating-update",
    ),
]
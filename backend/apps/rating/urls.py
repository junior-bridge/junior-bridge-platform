from django.urls import path

from .views import RatingUpdateView, TesterReputationView


urlpatterns = [
    path(
        "my-reputation/",
        TesterReputationView.as_view(),
        name="my-reputation",
    ),
    path(
        "<int:id_rating>/",
        RatingUpdateView.as_view(),
        name="rating-update",
    ),
]
from django.urls import path

from apps.postulations.views import ProjectPostulationCreateView

from .views import ProjectCreateView


urlpatterns = [
    path('', ProjectCreateView.as_view(), name='project-create'),
      path(
        '<int:id_project>/postulations/',
        ProjectPostulationCreateView.as_view(),
        name='project-postulation-create'
    ),
]

from django.urls import path

from apps.postulations.views import ProjectPostulationCreateView

from .views import ProjectCreateView, ProjectStatusUpdateView


urlpatterns = [
    path('', ProjectCreateView.as_view(), name='project-create'),
      path(
        '<int:id_project>/postulations/',
        ProjectPostulationCreateView.as_view(),
        name='project-postulation-create'
    ),
    path(
        '<int:pk>/status/',
        ProjectStatusUpdateView.as_view(),
        name='project-status-update',
    ),
]

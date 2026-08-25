from django.urls import path

from apps.postulations.views import ProjectPostulationCreateView

from .views import ProjectListCreateView, ProjectStatusUpdateView, UserProjectsListView


urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='project-create'),
    path('user-active/', UserProjectsListView.as_view(), name='project-user-active'),
    path(
        '<int:id_project>/postulations/',
        ProjectPostulationCreateView.as_view(),
        name='project-postulation-create'
    ),
    path(
        '<int:id_project>/status/',
        ProjectStatusUpdateView.as_view(),
        name='project-status-update',
    ),
]

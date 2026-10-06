from django.urls import path

from apps.postulations.views import ProjectPostulationCreateView

from .views import ProjectCompleteView, ProjectDetailView, ProjectListCreateView, ProjectStatusUpdateView, UserProjectsListView, ProjectFinishDeliveryView


urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='project-create'),
    path('user-active/', UserProjectsListView.as_view(), name='project-user-active'),
    path(
        '<int:pk>/',
        ProjectDetailView.as_view(),
        name='project-detail',
    ),
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
    path(
        '<int:pk>/finish-delivery/',
        ProjectFinishDeliveryView.as_view(),
        name='project-finish-delivery',
    ),
    path(
        '<int:pk>/complete/',
        ProjectCompleteView.as_view(),
        name='project-complete',
    ),
]
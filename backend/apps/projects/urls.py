from django.urls import path

from .views import ProjectCreateView, ProjectStatusUpdateView


urlpatterns = [
    path('', ProjectCreateView.as_view(), name='project-create'),
    path(
        '<int:pk>/status/',
        ProjectStatusUpdateView.as_view(),
        name='project-status-update',
    ),
]

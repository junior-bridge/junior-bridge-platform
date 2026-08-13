from django.urls import path

from .views import ProyectCreateView


urlpatterns = [
    path('', ProyectCreateView.as_view(), name='proyect-create'),
]

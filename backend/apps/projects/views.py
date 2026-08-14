from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsAdmin, IsClient

from .models import Project
from .serializers import ProjectSerializer, ProjectStatusSerializer


class ProjectCreateView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)


class ProjectStatusUpdateView(generics.UpdateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectStatusSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ['patch', 'options']

    def perform_update(self, serializer):
        if self.get_object().state != 'PENDING':
            raise ValidationError(
                {'state': 'Only pending projects can be approved or rejected.'}
            )

        serializer.save()

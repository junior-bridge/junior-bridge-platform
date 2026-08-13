from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsClient

from .models import Project
from .serializers import ProjectSerializer


class ProjectCreateView(generics.CreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsClient]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Proyect
from .serializers import ProyectSerializer


class ProyectCreateView(generics.CreateAPIView):
    queryset = Proyect.objects.all()
    serializer_class = ProyectSerializer
    # Provisorio: agregar el permiso de emprendedor cuando Ezequiel defina
    # las clases de permisos por rol.
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Provisorio: verificar esta relación cuando Lis integre el modelo
        # de usuario definitivo y la autenticación JWT.
        serializer.save(client=self.request.user)

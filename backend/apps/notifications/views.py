from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status

from channels.layers import get_channel_layer
import asyncio
import json
import logging

from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationListSerializer,
    NotificationCreateSerializer,
    NotificationUpdateSerializer,
    NotificationWebSocketSerializer
)

logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════════════════════
# VIEWSET: Notificaciones
# Maneja todas las operaciones CRUD (Create, Read, Update, Delete)
# ════════════════════════════════════════════════════════════════════════════

class NotificationViewSet(ModelViewSet):
    """
    ViewSet para manejar Notificaciones
    
    Endpoints automáticos:
    - GET    /api/notifications/              → Listar mis notificaciones
    - POST   /api/notifications/              → Crear notificación
    - GET    /api/notifications/{id}/         → Traer una notificación
    - PATCH  /api/notifications/{id}/         → Marcar como leída
    - DELETE /api/notifications/{id}/         → Eliminar notificación
    """
    
    # ────────────────────────────────────────────────────────────────────────
    # CONFIGURACIÓN BÁSICA
    # ────────────────────────────────────────────────────────────────────────
    
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication, TokenAuthentication]
    
    # ────────────────────────────────────────────────────────────────────────
    # MÉTODO 1: get_queryset()
    # Se ejecuta cuando haces GET /api/notifications/
    # ────────────────────────────────────────────────────────────────────────
    
    def get_queryset(self):
        """
        Devuelve SOLO las notificaciones del usuario autenticado
        
        Seguridad:
        - El usuario NO puede ver notificaciones de otros
        - Solo sus propias notificaciones
        
        Orden:
        - Las más nuevas primero (-created_at)
        """
        
        user = self.request.user
        
        # Filtrar por usuario, ordenar por fecha
        queryset = Notification.objects.filter(
            id_user=user
        ).order_by('-created_at')
        
        logger.info(f"Usuario {user.id} consultó notificaciones")
        
        return queryset
    
    # ────────────────────────────────────────────────────────────────────────
    # MÉTODO 2: get_serializer_class()
    # Elige qué Serializer usar según la acción
    # ────────────────────────────────────────────────────────────────────────
    
    def get_serializer_class(self):
        """
        Devuelve el Serializer apropiado según la acción
        
        Lógica:
        - Si action es 'create' → NotificationCreateSerializer
        - Si action es 'update' o 'partial_update' → NotificationUpdateSerializer
        - Sino (list, retrieve) → NotificationListSerializer
        """
        
        if self.action == 'create':
            # POST: Crear notificación, recibir solo type y message
            return NotificationCreateSerializer
        
        elif self.action in ['update', 'partial_update']:
            # PATCH: Actualizar, solo is_read
            return NotificationUpdateSerializer
        
        else:  # list, retrieve
            # GET: Listar o traer una, mostrar todos los datos
            return NotificationListSerializer
    
    # ────────────────────────────────────────────────────────────────────────
    # MÉTODO 3: perform_create()
    # Se ejecuta DESPUÉS de validar, ANTES de guardar
    # POST /api/notifications/
    # ────────────────────────────────────────────────────────────────────────
    
    def perform_create(self, serializer):
        """
        Cuando se crea una notificación:
        1. Guardar en BD con el usuario actual
        2. Emitir por WebSocket (tiempo real)
        3. Logs
        
        NOTA: Esto es más para testing. En producción,
        las notificaciones se crean vía Signals (PASO 7)
        """
        
        user = self.request.user
        
        # Guardar en BD
        notification = serializer.save(id_user=user)
        
        logger.info(f"Notificación {notification.id_notification} creada para {user.id}")
        
        # 🔴 EMITIR POR WEBSOCKET (Tiempo real)
        # ────────────────────────────────────────────────────────────────────
        # Aquí enviamos la notificación por WebSocket al usuario destino
        # ────────────────────────────────────────────────────────────────────
        
        try:
            # Serializar la notificación para WebSocket
            ws_serializer = NotificationWebSocketSerializer(notification)
            
            # Obtener channel_layer
            channel_layer = get_channel_layer()
            
            # Ejecutar async desde contexto sync
            asyncio.run(
                channel_layer.group_send(
                    f"user_{user.id}_notifications",
                    {
                        "type": "notification.received",
                        "notification_id": ws_serializer.data['id_notification'],
                        "title": f"Nueva {ws_serializer.data['type']}",
                        "message": ws_serializer.data['message'],
                        "notification_type": ws_serializer.data['type'],
                        "username": ws_serializer.data['username'],
                        "created_at": str(ws_serializer.data['created_at']),
                        "is_read": ws_serializer.data['is_read'],
                    }
                )
            )
            
            logger.info(f"WebSocket: Notificación enviada a usuario {user.id}")
            
        except Exception as e:
            logger.error(f"Error emitiendo WebSocket: {str(e)}")
            # No lanzamos error, simplemente logueamos
            # La notificación ya está en BD
    
    # ────────────────────────────────────────────────────────────────────────
    # MÉTODO 4: perform_update()
    # Se ejecuta DESPUÉS de validar, ANTES de guardar
    # PATCH /api/notifications/{id}/
    # ────────────────────────────────────────────────────────────────────────
    
    def perform_update(self, serializer):
        """
        Cuando se actualiza una notificación (marcar como leída):
        1. Guardar en BD
        2. Emitir por WebSocket (actualización en tiempo real)
        3. Logs
        """
        
        notification = serializer.save()
        user = self.request.user
        
        logger.info(
            f"Notificación {notification.id_notification} actualizada. "
            f"is_read={notification.is_read}"
        )
        
        # 🔴 EMITIR ACTUALIZACIÓN POR WEBSOCKET
        # ────────────────────────────────────────────────────────────────────
        
        try:
            ws_serializer = NotificationWebSocketSerializer(notification)
            channel_layer = get_channel_layer()
            
            asyncio.run(
                channel_layer.group_send(
                    f"user_{user.id}_notifications",
                    {
                        "type": "notification.updated",
                        "notification_id": ws_serializer.data['id_notification'],
                        "is_read": ws_serializer.data['is_read'],
                    }
                )
            )
            
            logger.info(f"WebSocket: Actualización enviada a usuario {user.id}")
            
        except Exception as e:
            logger.error(f"Error emitiendo WebSocket update: {str(e)}")
    
    # ────────────────────────────────────────────────────────────────────────
    # ACCIONES PERSONALIZADAS (Opcionales)
    # ────────────────────────────────────────────────────────────────────────
    
    def destroy(self, request, *args, **kwargs):
        """
        Cuando se elimina una notificación
        DELETE /api/notifications/{id}/
        """
        
        notification = self.get_object()
        
        logger.info(
            f"Notificación {notification.id_notification} eliminada "
            f"por usuario {request.user.id}"
        )
        
        # Llamar al método padre
        return super().destroy(request, *args, **kwargs)


# ════════════════════════════════════════════════════════════════════════════
# RESPUESTA DE EJEMPLO
# ════════════════════════════════════════════════════════════════════════════

"""
EJEMPLO 1: GET /api/notifications/

Status: 200 OK

{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id_notification": 123,
      "id_user": {
        "id": 456,
        "username": "juan_perez",
        "email": "juan@example.com"
      },
      "type": "postulation",
      "message": "Usuario X postulo a tu proyecto Y",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id_notification": 122,
      "id_user": {
        "id": 789,
        "username": "maria_garcia",
        "email": "maria@example.com"
      },
      "type": "comment",
      "message": "Maria comento en tu proyecto",
      "is_read": true,
      "created_at": "2024-01-14T15:45:00Z"
    }
  ]
}


EJEMPLO 2: POST /api/notifications/

Request:
{
  "type": "postulation",
  "message": "Usuario X postulo a tu proyecto Y"
}

Status: 201 Created

Response:
{
  "id_notification": 124,
  "id_user": {
    "id": 123,
    "username": "current_user",
    "email": "user@example.com"
  },
  "type": "postulation",
  "message": "Usuario X postulo a tu proyecto Y",
  "is_read": false,
  "created_at": "2024-01-15T11:00:00Z"
}


EJEMPLO 3: PATCH /api/notifications/123/

Request:
{
  "is_read": true
}

Status: 200 OK

Response:
{
  "is_read": true
}


EJEMPLO 4: Error - Tipo inválido

Request:
{
  "type": "invalid_type",
  "message": "Test"
}

Status: 400 Bad Request

{
  "type": [
    "Tipo de notificación inválido. Debe ser uno de: postulation, comment, message, system"
  ]
}
"""

# ════════════════════════════════════════════════════════════════════════════
# RESUMEN DE MÉTODOS
# ════════════════════════════════════════════════════════════════════════════

"""
┌─────────────────────────────────────────────────────────────┐
│ MÉTODOS QUE IMPLEMENTAMOS:                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. get_queryset()                                           │
│    Filtra notificaciones del usuario actual                 │
│    Se ejecuta: Siempre, antes de cualquier operación       │
│                                                              │
│ 2. get_serializer_class()                                   │
│    Elige el Serializer según la acción                      │
│    Se ejecuta: Siempre, para validar/serializar             │
│                                                              │
│ 3. perform_create()                                         │
│    Guarda + emite por WebSocket                             │
│    Se ejecuta: POST /api/notifications/                     │
│                                                              │
│ 4. perform_update()                                         │
│    Actualiza + emite por WebSocket                          │
│    Se ejecuta: PATCH /api/notifications/{id}/               │
│                                                              │
│ 5. destroy()                                                │
│    Registra eliminación                                     │
│    Se ejecuta: DELETE /api/notifications/{id}/              │
└─────────────────────────────────────────────────────────────┘
"""

# ════════════════════════════════════════════════════════════════════════════
# ✅ LISTO PARA USAR
# ════════════════════════════════════════════════════════════════════════════
#
# Reemplazar el contenido de:
# → backend/apps/notifications/views.py
#
# Verificar que no hay errores:
# → python manage.py check
#
# Probar en Postman/REST Client:
# → GET http://localhost:8000/api/notifications/
#
# Siguiente paso: PASO_7_Signals.py (emitir notificaciones automáticamente)
#
# ════════════════════════════════════════════════════════════════════════════
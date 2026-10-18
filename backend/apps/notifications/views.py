from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from apps.users.authentication import CookieJWTAuthentication
from rest_framework.response import Response
from rest_framework import status

from channels.layers import get_channel_layer
import asyncio
import json
import logging

from apps.notifications.models import Notification
from apps.notifications.ws_ticket import WS_TICKET_MAX_AGE_SECONDS, issue_ticket
from apps.notifications.serializers import (
    NotificationListSerializer,
    NotificationCreateSerializer,
    NotificationUpdateSerializer,
    NotificationWebSocketSerializer
)

logger = logging.getLogger(__name__)
@extend_schema_view(
    list=extend_schema(summary="List my notifications", description="List the notifications of the authenticated user, newest first."),
    create=extend_schema(summary="Create notification", description="Create a notification for the authenticated user and push it over WebSocket."),
    retrieve=extend_schema(summary="Retrieve notification"),
    update=extend_schema(summary="Update notification", description="Update the read state of a notification."),
    partial_update=extend_schema(summary="Partially update notification", description="Update the read state of a notification."),
    destroy=extend_schema(summary="Delete notification"),
)
@extend_schema(tags=['Notifications'])
class NotificationViewSet(ModelViewSet):
    
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication, TokenAuthentication]
    
    def get_queryset(self):        
        user = self.request.user
        queryset = Notification.objects.filter(
            id_user=user
        ).order_by('-created_at')
        
        logger.info(f"Usuario {user.id} consultó notificaciones")
        
        return queryset
  
    @extend_schema(
        summary="Issue WebSocket ticket",
        description="Return a short-lived signed ticket to authenticate the notifications WebSocket via ?ticket=.",
    )
    @action(detail=False, methods=['get'], url_path='ws-ticket')
    def ws_ticket(self, request):
        response = Response({
            'ticket': issue_ticket(request.user),
            'expires_in': WS_TICKET_MAX_AGE_SECONDS,
        })
        response['Cache-Control'] = 'no-store'
        return response

    def get_serializer_class(self):

        
        if self.action == 'create':
            return NotificationCreateSerializer
        
        elif self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        
        else: 
            return NotificationListSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        
        notification = serializer.save(id_user=user)
        
        logger.info(f"Notificación {notification.id_notification} creada para {user.id}")
      
        try:
            ws_serializer = NotificationWebSocketSerializer(notification)
            

            channel_layer = get_channel_layer()
          
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
    
    def perform_update(self, serializer):
        
        notification = serializer.save()
        user = self.request.user
        
        logger.info(
            f"Notificación {notification.id_notification} actualizada. "
            f"is_read={notification.is_read}"
        )
      
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
    
    
    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        
        logger.info(
            f"Notificación {notification.id_notification} eliminada "
            f"por usuario {request.user.id}"
        )
        
        return super().destroy(request, *args, **kwargs)

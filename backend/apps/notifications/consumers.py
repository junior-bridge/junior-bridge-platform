# ============================================================================
# PASO 4: Crear archivo: backend/apps/notifications/consumers.py
# ============================================================================
#
# Este es el CORAZÓN de tu sistema WebSocket
# Un Consumer es lo opuesto a una View (para HTTP)
#
# View = Recibe HTTP request, devuelve HTTP response
# Consumer = Recibe WebSocket connection, mantiene conexión abierta
#
# ============================================================================

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from apps.notifications.models import Notification
from apps.users.models import User

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.user = self.scope["user"] 
        if isinstance(self.user, AnonymousUser):
            await self.close()
            logger.warning("Intento de conexión sin autenticación")
            return

        self.user_id = self.user.id
        self.room_group_name = f"user_{self.user_id}_notifications"
        
        await self.channel_layer.group_add(
            self.room_group_name,  
            self.channel_name      
        )
        await self.accept()
        
        logger.info(f"Usuario {self.user.id} conectado a WebSocket")
        
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Conectado a notificaciones en tiempo real",
            "user_id": self.user_id
        }))
    
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        logger.info(f"Usuario {self.user_id} desconectado de WebSocket")
    
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            
            if message_type == "notification_read":
                notification_id = data.get("notification_id")
                await self.mark_notification_read(notification_id)
                
            elif message_type == "get_unread":
                unread_count = await self.get_unread_count()
                await self.send(text_data=json.dumps({
                    "type": "unread_count",
                    "count": unread_count
                }))
                
            elif message_type == "ping":
                await self.send(text_data=json.dumps({
                    "type": "pong"
                }))
                
        except json.JSONDecodeError:
            logger.error("Error al parsear JSON recibido")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Formato de mensaje inválido"
            }))
    

    
    async def notification_received(self, event):
        notification_id = event.get("notification_id")
        title = event.get("title")
        message = event.get("message")
        notification_type = event.get("notification_type")
        await self.send(text_data=json.dumps({
            "type": "new_notification",
            "notification_id": notification_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
        }))
        
        logger.info(f"Notificación {notification_id} enviada a usuario {self.user_id}")
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        try:
            notification = Notification.objects.get(
                id_notification=notification_id,
                id_user=self.user
            )
            notification.is_read = True
            notification.save()
            logger.info(f"Notificación {notification_id} marcada como leída")
        except Notification.DoesNotExist:
            logger.warning(f"Notificación {notification_id} no encontrada")
    
    
    @database_sync_to_async
    def get_unread_count(self):
        return Notification.objects.filter(
            id_user=self.user,
            is_read=False
        ).count()



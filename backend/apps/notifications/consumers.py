import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.user = self.scope.get("user")
        
        logger.info(f"Usuario conectando: {self.user}")
        
        if self.user and self.user.is_authenticated:
            self.user_id = self.user.id
            self.room_group_name = f"user_{self.user_id}_notifications"
            
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            logger.info(f"✅ Usuario {self.user.id} conectado")
            
            await self.send(text_data=json.dumps({
                "type": "connection_established",
                "message": "Conectado",
                "user_id": self.user_id
            }))
        else:
            logger.warning(f"❌ Usuario no autenticado: {self.user}")
            await self.close()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"Usuario desconectado")
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            
            if message_type == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
                
        except Exception as e:
            logger.error(f"Error recibiendo: {str(e)}")
    
    async def notification_received(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_notification",
            "notification_id": event.get("notification_id"),
            "title": event.get("title"),
            "message": event.get("message"),
            "notification_type": event.get("notification_type"),
        }))
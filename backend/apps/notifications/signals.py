from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync  # ✅ AGREGAR ESTO
from apps.postulations.models import Postulation
from apps.notifications.models import Notification
from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Postulation)
def notify_new_postulation(sender, instance, created, **kwargs):
    if not created:
        return 
    
    postulation = instance
    user_destinatario = postulation.id_project.client  
    
    notification = Notification.objects.create(
        id_user=user_destinatario,
        type='postulation',
        message=f"{postulation.id_tester.name} {postulation.id_tester.surname} se postulo a {postulation.id_project.title}",
        is_read=False
    )
    
    logger.info(f"Notificación {notification.id_notification} creada")
    
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f"user_{user_destinatario.id}_notifications",
        {
            "type": "notification_received", 
            "notification_id": notification.id_notification,
            "title": "Nueva postulación",
            "message": notification.message,
            "notification_type": "postulation",
            "username": postulation.id_tester.username,
            "created_at": str(notification.created_at),
        }
    )


@receiver(post_save, sender=Postulation)
def notify_postulation_accepted(sender, instance, created, **kwargs):
    if created:
        return  
    
    postulation = instance
    
    if postulation.status == 'accepted': 
        user_destinatario = postulation.id_tester 
        
        notification = Notification.objects.create(
            id_user=user_destinatario,
            type='message',
            message=f"Tu postulación a {postulation.id_project.title} fue aceptada!",
            is_read=False
        )
        
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            f"user_{user_destinatario.id}_notifications",
            {
                "type": "notification_received",  
                "notification_id": notification.id_notification,
                "title": "Postulación aceptada",
                "message": notification.message,
                "notification_type": "message",
                "username": "Sistema",
                "created_at": str(notification.created_at),
            }
        )
@receiver(post_save, sender=Postulation)
def notify_postulation_rejected(sender, instance, created, **kwargs):
    if created:
        return  
    
    postulation = instance
    
    if postulation.status == 'rejected': 
        user_destinatario = postulation.id_tester 
        
        notification = Notification.objects.create(
            id_user=user_destinatario,
            type='message',
            message=f"Tu postulación a {postulation.id_project.title} fue rechazada.",
            is_read=False
        )
        
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            f"user_{user_destinatario.id}_notifications",
            {
                "type": "notification_received",
                "notification_id": notification.id_notification,
                "title": "Postulación rechazada",
                "message": notification.message,
                "notification_type": "message",
                "username": "Sistema",
                "created_at": str(notification.created_at),
            }
        )
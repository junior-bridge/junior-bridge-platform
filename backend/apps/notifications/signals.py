from django.db import transaction
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from apps.postulations.models import Postulation
from apps.notifications.models import Notification
from apps.notifications.services import send_notification_email
from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Postulation)
def cache_previous_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._previous_status = Postulation.objects.values_list(
                'status',
                flat=True
            ).get(pk=instance.pk)
        except Postulation.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None

@receiver(post_save, sender=Postulation)
def notify_new_postulation(sender, instance, created, **kwargs):
    if not created:
        return

    user_destinatario = instance.id_project.client

    notification = Notification.objects.create(
        id_user=user_destinatario,
        type='postulation',
        message=f"{instance.id_tester.name} {instance.id_tester.surname} se postulo a {instance.id_project.title}",
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
            "username": instance.id_tester.username,
            "created_at": str(notification.created_at),
        }
    )

@receiver(post_save, sender=Postulation)
def notify_postulation_accepted(sender, instance, created, **kwargs):
    if created:
        return
    previous = getattr(instance, '_previous_status', None)
    if previous == instance.status or instance.status != 'accepted':
        return

    user_destinatario = instance.id_tester
    notification = Notification.objects.create(
        id_user=user_destinatario,
        type='message',
        message=f"Tu postulación a {instance.id_project.title} fue aceptada.",
        is_read=False
    )

    def send_external_notifications():
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

        send_notification_email(
            user=user_destinatario,
            subject="Tu postulación fue aceptada, felicidades!",
            message=(
                f"Hola {user_destinatario.name},\n\n"
                f"¡Felicidades! Tu postulación al proyecto "
                f"'{instance.id_project.title}' fue aceptada.\n\n"
                f"Ingresá a JuniorBridge para comenzar. \n\n"
                f"Saludos"
            )
        )

    transaction.on_commit(send_external_notifications)

@receiver(post_save, sender=Postulation)
def notify_postulation_rejected(sender, instance, created, **kwargs):
    if created:
        return

    previous = getattr(instance, '_previous_status', None)

    if previous == instance.status or instance.status != 'rejected':
        return
    user_destinatario = instance.id_tester

    notification = Notification.objects.create(
        id_user=user_destinatario,
        type='message',
        message=f"Tu postulación a {instance.id_project.title} fue rechazada.",
        is_read=False
    )

    def send_external_notifications():
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

        send_notification_email(
            user=user_destinatario,
            subject="Tu postulación fue rechazada — JuniorBridge",
            message=(
                f"Hola {user_destinatario.name},\n\n"
                f"Lamentablemente, tu postulación al proyecto "
                f"'{instance.id_project.title}' fue rechazada.\n\n"
                f"Te animamos a seguir participando en otros proyectos. \n\n"
                f"Saludos"
            )
        )

    transaction.on_commit(send_external_notifications)
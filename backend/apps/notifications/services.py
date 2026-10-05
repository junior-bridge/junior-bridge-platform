from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)


def send_notification_email(user, subject, message):
    if not user.email:
        logger.warning(f"Usuario {user.id} no tiene email configurado.")
        return

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Email enviado a {user.email}: {subject}")
    except Exception as e:
        logger.error(f"Error enviando email a {user.email}: {e}")
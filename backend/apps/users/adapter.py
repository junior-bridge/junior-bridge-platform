import logging
from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.providers.base import AuthError

from django.conf import settings
from django.shortcuts import redirect

from .models import User
from .services import (
    apply_social_role,
    validate_oauth_context,
    validate_oauth_process,
)

logger = logging.getLogger(__name__)


class JuniorBridgeSocialAccountAdapter(DefaultSocialAccountAdapter):

    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        process = request.session.get("oauth_process")

        if process == "signup":
            try:
                flow = validate_oauth_context(
                    request,
                    sociallogin.account.provider,
                )
                apply_social_role(user, flow)
            except Exception as e:
                logger.warning(f"Error al aplicar rol de OAuth: {e}")

        return user

    def pre_social_login(self, request, sociallogin):
        process = request.session.get("oauth_process")

        if process:
            try:
                validate_oauth_process(process)
            except Exception as e:
                logger.warning(f"Error en validate_oauth_process: {e}")

        verified_email = next(
            (
                email_address.email
                for email_address in getattr(sociallogin, "email_addresses", [])
                if getattr(email_address, "verified", False)
            ),
            None,
        ) or getattr(sociallogin.user, "email", None)

        if not verified_email:
            raise ImmediateHttpResponse(
                redirect(
                    f"{settings.FRONTEND_OAUTH_ERROR_URL}"
                    "?error=oauth_failed&reason=email_not_verified"
                )
            )

        existing_user = User.objects.filter(email__iexact=verified_email).first()

        if existing_user:
            sociallogin.connect(request, existing_user)

        return super().pre_social_login(request, sociallogin)

    def on_authentication_error(
        self, request, provider, error=None, exception=None, extra_context=None
    ):
        logger.error(
            f"Error de OAuth en proveedor {provider}: error={error}, exception={exception}"
        )
        reason = "cancelled" if error == AuthError.CANCELLED else "provider_error"
        raise ImmediateHttpResponse(
            redirect(
                f"{settings.FRONTEND_OAUTH_ERROR_URL}"
                f"?error=oauth_failed&reason={reason}"
            )
        )
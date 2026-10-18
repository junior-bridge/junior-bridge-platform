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

    def list_apps(self, request, provider=None, client_id=None):
        # Apps from settings.SOCIALACCOUNT_PROVIDERS are unsaved (pk is None).
        # For those providers, ignore SocialApp rows: leftover rows (e.g. created
        # by local docker-compose on a shared DB) would raise MultipleObjectsReturned.
        apps = super().list_apps(request, provider=provider, client_id=client_id)
        settings_providers = {app.provider for app in apps if app.pk is None}
        return [
            app
            for app in apps
            if app.pk is None or app.provider not in settings_providers
        ]

    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        user.role = User.Role.TESTER
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
            if not existing_user.role:
                existing_user.role = User.Role.TESTER
                existing_user.save(update_fields=["role"])

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
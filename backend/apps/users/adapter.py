from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from django.conf import settings
from django.shortcuts import redirect

from .models import User
from .services import (
    apply_social_role,
    validate_oauth_context,
    validate_oauth_process,
)


class JuniorBridgeSocialAccountAdapter(
    DefaultSocialAccountAdapter
):

    def is_auto_signup_allowed(self, request, sociallogin):
        process = request.session.get("oauth_process")

        if process == "login":
            return False

        return super().is_auto_signup_allowed(
            request,
            sociallogin,
        )

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(
            request,
            sociallogin,
            data,
        )

        process = request.session.get("oauth_process")

        if process == "signup":
            flow = validate_oauth_context(
                request,
                sociallogin.account.provider,
            )

            apply_social_role(
                user,
                flow,
            )

        return user

    def pre_social_login(self, request, sociallogin):
        process = request.session.get("oauth_process")

        validate_oauth_process(process)

        verified_email = next(
            (
                email_address.email
                for email_address in sociallogin.email_addresses
                if email_address.verified
            ),
            None,
        )

        if process == "login" and not sociallogin.is_existing:
            if not verified_email:
                raise ImmediateHttpResponse(
                    redirect(
                        f"{settings.FRONTEND_OAUTH_ERROR_URL}"
                        "?error=oauth_failed"
                        "&reason=email_not_verified"
                    )
                )

            existing_user = User.objects.filter(
                email__iexact=verified_email
            ).first()

            if not existing_user:
                raise ImmediateHttpResponse(
                    redirect(
                        f"{settings.FRONTEND_OAUTH_ERROR_URL}"
                        "?error=oauth_failed"
                        "&reason=account_not_registered"
                    )
                )

            sociallogin.connect(
                request,
                existing_user,
            )

        if process == "signup" and verified_email:
            existing_user = User.objects.filter(
                email__iexact=verified_email
            ).first()

            if existing_user:
                raise ImmediateHttpResponse(
                    redirect(
                        f"{settings.FRONTEND_OAUTH_ERROR_URL}"
                        "?error=oauth_failed"
                        "&reason=account_already_exists"
                    )
                )

        return super().pre_social_login(
            request,
            sociallogin,
        )
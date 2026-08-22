from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

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
        flow = request.session.get("oauth_flow")

        print(
            "OAUTH POPULATE DEBUG:",
            "process=",
            process,
            "flow=",
            flow,
            "provider=",
            sociallogin.account.provider,
            "role_before=",
            repr(user.role),
            flush=True,
        )

        if process == "signup":
            flow = validate_oauth_context(
                request,
                sociallogin.account.provider,
            )

            apply_social_role(
                user,
                flow,
            )

        print(
            "OAUTH POPULATE RESULT:",
            "process=",
            process,
            "flow=",
            flow,
            "role_after=",
            repr(user.role),
            flush=True,
        )

        return user

    def pre_social_login(self, request, sociallogin):
        process = request.session.get("oauth_process")

        validate_oauth_process(process)

        return super().pre_social_login(
            request,
            sociallogin,
        )
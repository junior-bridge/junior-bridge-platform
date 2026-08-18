from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class JuniorBridgeSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(
            request,
            sociallogin,
            data,
        )

        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        full_name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()

        if not first_name and full_name:
            parts = full_name.split(maxsplit=1)

            first_name = parts[0]

            if len(parts) > 1 and not last_name:
                last_name = parts[1]

        if not first_name and email:
            first_name = email.split("@", 1)[0]

        user.name = first_name
        user.surname = last_name

        return user
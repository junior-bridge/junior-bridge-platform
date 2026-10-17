from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from .adapter import JuniorBridgeSocialAccountAdapter
from .models import User


class SocialAccountAdapterTests(SimpleTestCase):
    def populate_user(self, provider, session):
        user = User(role="")
        sociallogin = SimpleNamespace(
            account=SimpleNamespace(provider=provider),
        )

        with patch(
            "apps.users.adapter.DefaultSocialAccountAdapter.populate_user",
            return_value=user,
        ):
            return JuniorBridgeSocialAccountAdapter().populate_user(
                SimpleNamespace(session=session),
                sociallogin,
                {},
            )

    def test_new_google_or_github_user_defaults_to_tester(self):
        for provider in ("google", "github"):
            with self.subTest(provider=provider):
                user = self.populate_user(
                    provider,
                    {"oauth_process": "signup"},
                )

                self.assertEqual(user.role, User.Role.TESTER)

    def test_signup_flow_can_still_assign_entrepreneur_role(self):
        user = self.populate_user(
            "google",
            {
                "oauth_process": "signup",
                "oauth_flow": "entrepreneur",
            },
        )

        self.assertEqual(user.role, User.Role.CLIENT)

    def test_existing_social_user_with_empty_role_defaults_to_tester(self):
        user = SimpleNamespace(role="", save=Mock())
        sociallogin = Mock()
        sociallogin.email_addresses = []
        sociallogin.user.email = "tester@example.com"
        queryset = Mock()
        queryset.first.return_value = user
        request = SimpleNamespace(session={})

        with (
            patch("apps.users.adapter.User.objects.filter", return_value=queryset),
            patch(
                "apps.users.adapter.DefaultSocialAccountAdapter.pre_social_login",
                return_value=None,
            ),
        ):
            JuniorBridgeSocialAccountAdapter().pre_social_login(
                request,
                sociallogin,
            )

        self.assertEqual(user.role, User.Role.TESTER)
        user.save.assert_called_once_with(update_fields=["role"])
        sociallogin.connect.assert_called_once_with(request, user)

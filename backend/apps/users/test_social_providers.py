from allauth.socialaccount.adapter import get_adapter
from django.conf import settings
from django.test import RequestFactory, TestCase


class SettingsBasedSocialProvidersTests(TestCase):
    """OAuth providers come from settings (env vars), not from SocialApp rows."""

    def setUp(self):
        self.request = RequestFactory().get("/accounts/github/login/")

    def test_github_app_is_resolved_without_database_rows(self):
        app = get_adapter(self.request).get_app(self.request, provider="github")

        expected = settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"]
        self.assertEqual(app.client_id, expected)

    def test_github_requests_the_email_scope(self):
        scope = settings.SOCIALACCOUNT_PROVIDERS["github"]["SCOPE"]

        self.assertIn("user:email", scope)

from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.models import SocialApp
from django.conf import settings
from django.contrib.sites.models import Site
from django.test import RequestFactory, TestCase


class SettingsBasedSocialProvidersTests(TestCase):
    """OAuth providers come from settings (env vars), not from SocialApp rows."""

    def setUp(self):
        self.request = RequestFactory().get("/accounts/github/login/")

    def test_github_app_is_resolved_without_database_rows(self):
        app = get_adapter(self.request).get_app(self.request, provider="github")

        expected = settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"]
        self.assertEqual(app.client_id, expected)

    def test_settings_app_wins_over_database_rows_for_the_same_provider(self):
        # Local docker-compose runs create_*_social_app against the shared DB,
        # and the Render start command links every SocialApp to the Site.
        site = Site.objects.get(pk=settings.SITE_ID)
        for provider in ("google", "github"):
            stale = SocialApp.objects.create(
                provider=provider, name=f"stale {provider}", client_id="stale-id", secret="x"
            )
            stale.sites.add(site)

        for provider in ("google", "github"):
            app = get_adapter(self.request).get_app(self.request, provider=provider)

            self.assertIsNone(app.pk)
            self.assertEqual(
                app.client_id,
                settings.SOCIALACCOUNT_PROVIDERS[provider]["APP"]["client_id"],
            )

    def test_database_row_is_used_when_provider_has_no_settings_app(self):
        site = Site.objects.get(pk=settings.SITE_ID)
        db_app = SocialApp.objects.create(
            provider="gitlab", name="GitLab", client_id="db-id", secret="x"
        )
        db_app.sites.add(site)

        apps = get_adapter(self.request).list_apps(self.request, provider="gitlab")

        self.assertEqual([app.pk for app in apps], [db_app.pk])

    def test_github_requests_the_email_scope(self):
        scope = settings.SOCIALACCOUNT_PROVIDERS["github"]["SCOPE"]

        self.assertIn("user:email", scope)

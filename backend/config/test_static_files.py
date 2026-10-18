"""Static files must be collectable and served by the app itself in production.

Render runs the API with ``DEBUG=False`` behind daphne, where Django does not
serve static files. WhiteNoise serves the collected files (admin, DRF browsable
API, Swagger UI assets) directly from ``STATIC_ROOT``.
"""

import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.test import SimpleTestCase, override_settings

SECURITY_MIDDLEWARE = "django.middleware.security.SecurityMiddleware"
WHITENOISE_MIDDLEWARE = "whitenoise.middleware.WhiteNoiseMiddleware"
WHITENOISE_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"


class StaticFilesSettingsTests(SimpleTestCase):
    def test_whitenoise_middleware_runs_right_after_security_middleware(self):
        middleware = list(settings.MIDDLEWARE)

        self.assertIn(WHITENOISE_MIDDLEWARE, middleware)
        security_index = middleware.index(SECURITY_MIDDLEWARE)
        self.assertEqual(middleware[security_index + 1], WHITENOISE_MIDDLEWARE)

    def test_static_root_is_configured(self):
        self.assertTrue(settings.STATIC_ROOT)

    def test_staticfiles_storage_uses_whitenoise_compression(self):
        self.assertEqual(settings.STORAGES["staticfiles"]["BACKEND"], WHITENOISE_STORAGE)


class CollectStaticTests(SimpleTestCase):
    def test_collectstatic_copies_admin_assets_into_static_root(self):
        with tempfile.TemporaryDirectory() as static_root:
            with override_settings(STATIC_ROOT=static_root):
                call_command("collectstatic", interactive=False, verbosity=0)

            self.assertTrue((Path(static_root) / "admin" / "css" / "base.css").exists())

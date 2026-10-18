import os
from unittest.mock import patch

from django.test import SimpleTestCase

from config.env import http_protocol_env


class HttpProtocolEnvTests(SimpleTestCase):
    def test_defaults_to_https_when_unset(self):
        # Production (Render) does not set the variable and must keep https.
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(http_protocol_env("ACCOUNT_DEFAULT_HTTP_PROTOCOL"), "https")

    def test_reads_http_for_local_development(self):
        with patch.dict(os.environ, {"ACCOUNT_DEFAULT_HTTP_PROTOCOL": " HTTP "}):
            self.assertEqual(http_protocol_env("ACCOUNT_DEFAULT_HTTP_PROTOCOL"), "http")

    def test_invalid_value_falls_back_to_https(self):
        with patch.dict(os.environ, {"ACCOUNT_DEFAULT_HTTP_PROTOCOL": "ftp"}):
            self.assertEqual(http_protocol_env("ACCOUNT_DEFAULT_HTTP_PROTOCOL"), "https")

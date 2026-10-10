import os
from unittest import mock

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.mail import get_connection
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.test import APITestCase

from config.env import positive_int_env

from .models import User


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_PASSWORD_RESET_URL="http://localhost:3000/reset-password",
)
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="client@example.com",
            password="OldPassword123!",
            name="Cliente",
            surname="Prueba",
            role=User.Role.CLIENT,
        )

    def test_request_generates_email_for_local_account(self):
        response = self.client.post(
            reverse("password-reset"),
            {"email": self.user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            "http://localhost:3000/reset-password/",
            mail.outbox[0].body,
        )

    def test_request_does_not_reveal_unknown_email(self):
        response = self.client.post(
            reverse("password-reset"),
            {"email": "unknown@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_request_does_not_email_oauth_only_account(self):
        oauth_user = User.objects.create_user(
            email="oauth@example.com",
            password=None,
            name="Tester",
            surname="OAuth",
            role=User.Role.TESTER,
        )

        response = self.client.post(
            reverse("password-reset"),
            {"email": oauth_user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_valid_token_changes_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "uid": uid,
                "token": token,
                "new_password": "NewPassword456!",
                "confirm_password": "NewPassword456!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword456!"))

    def test_invalid_token_does_not_change_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "uid": uid,
                "token": "invalid-token",
                "new_password": "NewPassword456!",
                "confirm_password": "NewPassword456!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPassword123!"))


class EmailSettingsTests(SimpleTestCase):
    def test_smtp_connection_has_a_finite_timeout(self):
        # Without a timeout, a slow SMTP server blocks the request forever.
        self.assertIsNotNone(settings.EMAIL_TIMEOUT)
        self.assertGreater(settings.EMAIL_TIMEOUT, 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_TIMEOUT=7,
    )
    def test_smtp_connection_uses_configured_timeout(self):
        connection = get_connection()
        self.assertEqual(connection.timeout, 7)


class PositiveIntEnvTests(SimpleTestCase):
    def read(self, value):
        env = {} if value is None else {"TEST_TIMEOUT": value}
        with mock.patch.dict(os.environ, env, clear=True):
            return positive_int_env("TEST_TIMEOUT", 10)

    def test_returns_default_when_variable_is_missing(self):
        self.assertEqual(self.read(None), 10)

    def test_returns_parsed_value_when_valid(self):
        self.assertEqual(self.read("30"), 30)

    def test_falls_back_to_default_for_invalid_values(self):
        for value in ["", "  ", "abc", "0", "-5"]:
            with self.subTest(value=value):
                self.assertEqual(self.read(value), 10)

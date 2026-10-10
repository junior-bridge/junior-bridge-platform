from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.test import APITestCase

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

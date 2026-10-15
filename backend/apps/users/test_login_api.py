from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


class LoginAPITests(APITestCase):
    def setUp(self):
        self.login_url = reverse("auth-login")
        self.email = "login-test@example.com"
        self.password = "StrongPassword123!"

        self.user = User.objects.create_user(
            email=self.email,
            password=self.password,
        )

    def valid_payload(self, **overrides):
        payload = {
            "email": self.email,
            "password": self.password,
        }
        payload.update(overrides)
        return payload

    def test_login_success_sets_auth_cookies(self):
        # Arrange
        # Act
        response = self.client.post(
            self.login_url,
            self.valid_payload(),
            format="json",
        )

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], self.email)
        self.assertNotIn("password", response.data["user"])

        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)

        self.assertTrue(response.cookies["access_token"]["httponly"])
        self.assertTrue(response.cookies["refresh_token"]["httponly"])
        self.assertEqual(response.cookies["access_token"]["path"], "/")
        self.assertEqual(
            response.cookies["refresh_token"]["path"],
            "/api/auth/token/refresh/",
        )

    def test_login_invalid_password_returns_400(self):
        # Arrange
        # Act
        response = self.client.post(
            self.login_url,
            self.valid_payload(password="WrongPassword123!"),
            format="json",
        )

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertNotIn("access_token", response.cookies)
        self.assertNotIn("refresh_token", response.cookies)

    def test_login_unknown_email_returns_400(self):
        # Arrange
        # Act
        response = self.client.post(
            self.login_url,
            self.valid_payload(email="unknown@example.com"),
            format="json",
        )

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertNotIn("access_token", response.cookies)

    def test_login_missing_email_returns_400(self):
        # Arrange
        payload = self.valid_payload()
        payload.pop("email")

        # Act
        response = self.client.post(
            self.login_url,
            payload,
            format="json",
        )

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("email", response.data)

    def test_login_missing_password_returns_400(self):
        # Arrange
        payload = self.valid_payload()
        payload.pop("password")

        # Act
        response = self.client.post(
            self.login_url,
            payload,
            format="json",
        )

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("password", response.data)

    def test_login_invalid_email_returns_400(self):
        # Arrange
        # Act
        response = self.client.post(
            self.login_url,
            self.valid_payload(email="correo-invalido"),
            format="json",
        )

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("email", response.data)
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


class RegisterAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse("auth-register")

    def valid_payload(self, **overrides):
        payload = {
            "email": "new-register@example.com",
            "password": "StrongPassword123!",
            "name": "Lis",
            "surname": "Aquino",
        }
        payload.update(overrides)
        return payload

    def test_register_success(self):
        payload = self.valid_payload()

        response = self.client.post(
            self.register_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        user = User.objects.get(email=payload["email"])

        self.assertEqual(user.role, User.Role.CLIENT)
        self.assertTrue(user.check_password(payload["password"]))
        self.assertNotIn("password", response.data["user"])

    def test_register_duplicate_email_returns_400(self):
        User.objects.create_user(
            email="existing@example.com",
            password="StrongPassword123!",
        )

        response = self.client.post(
            self.register_url,
            self.valid_payload(email="existing@example.com"),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn("email", response.data)

    def test_register_required_fields_returns_400(self):
        payload = self.valid_payload()
        payload.pop("name")
        payload.pop("surname")

        response = self.client.post(
            self.register_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn("name", response.data)
        self.assertIn("surname", response.data)

    def test_register_invalid_email_returns_400(self):
        response = self.client.post(
            self.register_url,
            self.valid_payload(email="correo-invalido"),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn("email", response.data)
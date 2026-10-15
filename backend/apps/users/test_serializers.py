from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase

from .serializers import RegisterSerializer, UserSerializer


User = get_user_model()


class RegisterSerializerTests(TestCase):

    def valid_payload(self):
        return {
            "email": "test@example.com",
            "password": "StrongPassword123!",
            "name": "Test",
            "surname": "User",
            "zona": "Buenos Aires",
        }

    def test_valid_data_creates_user(self):
        # Arrange
        # Act
        serializer = RegisterSerializer(data=self.valid_payload())

        # Assert
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user = serializer.save()

        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.name, "Test")
        self.assertEqual(user.surname, "User")
        self.assertEqual(user.zona, "Buenos Aires")

    def test_role_is_assigned_by_backend(self):
        # Arrange
        payload = self.valid_payload()
        payload["role"] = User.Role.ADMIN

        # Act
        serializer = RegisterSerializer(data=payload)

        # Assert
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user = serializer.save()

        self.assertEqual(user.role, User.Role.CLIENT)

    def test_client_cannot_control_internal_fields(self):
        # Arrange
        payload = self.valid_payload()
        payload.update(
            {
                "role": User.Role.ADMIN,
                "reputation": "99.99",
                "is_staff": True,
                "is_superuser": True,
                "is_active": False,
                "date_joined": date(2026, 1, 1),
                "created_at": date(2026, 1, 1),
                "updated_at": date(2026, 1, 1),
            }
        )

        # Act
        serializer = RegisterSerializer(data=payload)

        # Assert
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user = serializer.save()

        self.assertEqual(user.role, User.Role.CLIENT)
        self.assertEqual(user.reputation, 0)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_password_is_hashed(self):
        # Arrange
        # Act
        serializer = RegisterSerializer(data=self.valid_payload())

        # Assert
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user = serializer.save()

        self.assertNotEqual(user.password, "StrongPassword123!")
        self.assertTrue(user.check_password("StrongPassword123!"))

    def test_password_is_write_only(self):
        # Arrange
        # Act
        serializer = RegisterSerializer()

        # Assert
        self.assertTrue(serializer.fields["password"].write_only)

    def test_duplicate_email_is_rejected(self):
        # Arrange
        User.objects.create_user(
            email="test@example.com",
            password="StrongPassword123!",
            name="Existing",
            surname="User",
            zona="Buenos Aires",
            role=User.Role.CLIENT,
        )

        # Act
        serializer = RegisterSerializer(data=self.valid_payload())

        # Assert
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_invalid_password_is_rejected(self):
        # Arrange
        payload = self.valid_payload()
        payload["password"] = "password"

        # Act
        serializer = RegisterSerializer(data=payload)

        # Assert
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_required_fields_are_validated(self):
        # Arrange
        payload = {
            "email": "test@example.com",
            "password": "StrongPassword123!",
        }

        # Act
        serializer = RegisterSerializer(data=payload)

        # Assert
        self.assertFalse(serializer.is_valid())

        self.assertIn("name", serializer.errors)
        self.assertIn("surname", serializer.errors)

    def test_optional_fields_can_be_omitted(self):
        # Arrange
        # Act
        serializer = RegisterSerializer(data=self.valid_payload())

        # Assert
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_duplicate_dni_is_rejected(self):
        # Arrange
        User.objects.create_user(
            email="existing@example.com",
            password="StrongPassword123!",
            name="Existing",
            surname="User",
            dni="12345678",
            zona="Buenos Aires",
            role=User.Role.CLIENT,
        )

        payload = self.valid_payload()
        payload["dni"] = "12345678"

        # Act
        serializer = RegisterSerializer(data=payload)

        # Assert
        self.assertFalse(serializer.is_valid())
        self.assertIn("dni", serializer.errors)


class UserSerializerTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="StrongPassword123!",
            name="Test",
            surname="User",
            zona="Buenos Aires",
            role=User.Role.CLIENT,
            reputation=0,
        )

    def test_password_is_not_exposed(self):
        # Arrange
        # Act
        serializer = UserSerializer(instance=self.user)

        # Assert
        self.assertNotIn("password", serializer.data)

    def test_zone_is_writable(self):
        # Arrange
        # Act
        serializer = UserSerializer(
            instance=self.user,
            data={"zona": "Córdoba"},
            partial=True,
        )

        # Assert
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user = serializer.save()

        self.assertEqual(user.zona, "Córdoba")

    def test_protected_fields_are_read_only(self):
        # Arrange
        serializer = UserSerializer()

        # Act
        read_only_fields = serializer.Meta.read_only_fields

        # Assert
        self.assertIn("role", read_only_fields)
        self.assertIn("reputation", read_only_fields)
        self.assertIn("date_joined", read_only_fields)
        self.assertIn("created_at", read_only_fields)
        self.assertIn("updated_at", read_only_fields)

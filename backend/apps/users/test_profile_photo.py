from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class ProfilePhotoTests(APITestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        media_settings = override_settings(MEDIA_ROOT=self.media_directory.name)
        media_settings.enable()
        self.addCleanup(media_settings.disable)
        self.addCleanup(self.media_directory.cleanup)

        self.user = User.objects.create_user(
            email="profile-photo@example.com",
            password="test-password",
            name="Profile",
            surname="Photo",
            role=User.Role.TESTER,
        )
        self.client.force_authenticate(user=self.user)

    @staticmethod
    def create_image():
        image_data = BytesIO()
        Image.new("RGB", (1600, 1200), color="blue").save(
            image_data,
            format="PNG",
        )
        return SimpleUploadedFile(
            "profile.png",
            image_data.getvalue(),
            content_type="image/png",
        )

    def test_user_can_upload_compressed_profile_photo(self):
        # Arrange
        # Act
        response = self.client.put(
            reverse("auth-profile"),
            {"profile_photo_upload": self.create_image()},
            format="multipart",
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["profile_photo"],
            reverse("auth-profile-photo"),
        )

        self.user.refresh_from_db()
        with Image.open(self.user.profile_photo) as saved_image:
            self.assertEqual(saved_image.format, "JPEG")
            self.assertLessEqual(max(saved_image.size), 512)

    def test_profile_photo_is_served_inline_to_authenticated_user(self):
        # Arrange
        # Act
        response = self.client.put(
            reverse("auth-profile"),
            {"profile_photo_upload": self.create_image()},
            format="multipart",
        )
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        photo_response = self.client.get(reverse("auth-profile-photo"))

        self.assertEqual(photo_response.status_code, status.HTTP_200_OK)
        self.assertEqual(photo_response["Content-Type"], "image/jpeg")
        self.assertEqual(photo_response["Content-Disposition"], "inline")

    def test_other_user_cannot_read_profile_photo(self):
        # Arrange
        self.client.force_authenticate(user=None)

        # Act
        response = self.client.get(reverse("auth-profile-photo"))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

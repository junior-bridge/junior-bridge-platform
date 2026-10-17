from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.postulations.models import Postulation
from apps.projects.models import Project
from apps.users.models import User

from .models import Rating


class RatingAPITests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email='rating-client@example.com',
            password='test-password',
            name='Client',
            surname='User',
            role=User.Role.CLIENT,
        )
        self.other_client = User.objects.create_user(
            email='rating-other-client@example.com',
            password='test-password',
            name='Other',
            surname='Client',
            role=User.Role.CLIENT,
        )
        self.tester_user = User.objects.create_user(
            email='rating-tester@example.com',
            password='test-password',
            name='Tester',
            surname='User',
            role=User.Role.TESTER,
        )
        self.project = Project.objects.create(
            title='Completed project',
            description='Project ready to be rated.',
            repository='https://example.com/repository',
            demo_url='https://example.com/demo',
            technologies='Django, Next.js',
            modality='REMOTE',
            state='COMPLETED',
            client=self.client_user,
        )
        self.postulation = Postulation.objects.create(
            id_project=self.project,
            id_tester=self.tester_user,
            status=Postulation.State.ACCEPTED,
        )
        self.postulation_rating_url = reverse(
            'postulation-rating',
            kwargs={'id_postulation': self.postulation.pk},
        )
        self.rating_data = {
            'stars': 5,
            'comment': 'Excellent work.',
        }

    def create_rating(self):
        return Rating.objects.create(
            id_postulation=self.postulation,
            **self.rating_data,
        )

    def test_project_owner_can_create_rating(self):
        # Arrange
        self.client.force_authenticate(user=self.client_user)

        # Act
        response = self.client.post(
            self.postulation_rating_url,
            self.rating_data,
            format='json',
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.count(), 1)
        self.assertEqual(response.data['stars'], 5)

    def test_tester_can_get_rating_for_postulation(self):
        # Arrange
        rating = self.create_rating()
        self.client.force_authenticate(user=self.tester_user)

        # Act
        response = self.client.get(self.postulation_rating_url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id_rating'], rating.id_rating)
        self.assertEqual(response.data['stars'], rating.stars)

    def test_project_owner_can_update_rating(self):
        # Arrange
        rating = self.create_rating()
        rating_url = reverse(
            'rating-update',
            kwargs={'id_rating': rating.pk},
        )
        self.client.force_authenticate(user=self.client_user)
        updated_data = {
            'stars': 4,
            'comment': 'Very good work.',
        }

        # Act
        response = self.client.put(rating_url, updated_data, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rating.refresh_from_db()
        self.assertEqual(rating.stars, 4)
        self.assertEqual(rating.comment, 'Very good work.')

    def test_anonymous_user_cannot_access_rating_endpoints(self):
        # Arrange
        rating = self.create_rating()
        rating_url = reverse(
            'rating-update',
            kwargs={'id_rating': rating.pk},
        )

        # Act
        responses = [
            self.client.get(self.postulation_rating_url),
            self.client.post(
                self.postulation_rating_url,
                self.rating_data,
                format='json',
            ),
            self.client.put(rating_url, self.rating_data, format='json'),
        ]

        # Assert
        for response in responses:
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
            )

    def test_user_without_permission_cannot_create_or_update_rating(self):
        # Arrange
        rating = self.create_rating()
        rating_url = reverse(
            'rating-update',
            kwargs={'id_rating': rating.pk},
        )
        self.client.force_authenticate(user=self.other_client)

        # Act
        create_response = self.client.post(
            self.postulation_rating_url,
            self.rating_data,
            format='json',
        )
        update_response = self.client.put(
            rating_url,
            self.rating_data,
            format='json',
        )

        # Assert
        self.assertEqual(
            create_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            update_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_invalid_stars_returns_field_error(self):
        # Arrange
        self.client.force_authenticate(user=self.client_user)
        invalid_data = {
            'stars': 6,
            'comment': 'Invalid rating.',
        }

        # Act
        response = self.client.post(
            self.postulation_rating_url,
            invalid_data,
            format='json',
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('stars', response.data)
        self.assertFalse(Rating.objects.exists())

    def test_delete_method_is_not_allowed(self):
        # Arrange
        self.client.force_authenticate(user=self.client_user)

        # Act
        response = self.client.delete(self.postulation_rating_url)

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_tester_can_get_my_reputation(self):
        # Arrange
        rating = self.create_rating()
        self.tester_user.reputation = 5.0
        self.tester_user.save(update_fields=["reputation"])
        self.client.force_authenticate(user=self.tester_user)
        url = reverse("my-reputation")

        # Act
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_ratings"], 1)
        self.assertEqual(response.data["reputation"], 5.0)
        self.assertEqual(len(response.data["ratings"]), 1)
        self.assertEqual(response.data["ratings"][0]["stars"], rating.stars)
        self.assertEqual(
            response.data["ratings"][0]["project_title"],
            "Completed project",
        )
        self.assertEqual(
            response.data["ratings"][0]["entrepreneur_name"],
            "Client User",
        )

    def test_my_reputation_requires_authentication(self):
        # Arrange
        url = reverse("my-reputation")

        # Act
        response = self.client.get(url)

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_client_cannot_get_tester_reputation(self):
        # Arrange
        self.client.force_authenticate(user=self.client_user)
        url = reverse("my-reputation")

        # Act
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tester_only_gets_own_ratings(self):
        # Arrange
        own_rating = self.create_rating()
        other_tester = User.objects.create_user(
            email="rating-other-tester@example.com",
            password="test-password",
            name="Other",
            surname="Tester",
            role=User.Role.TESTER,
        )
        other_postulation = Postulation.objects.create(
            id_project=self.project,
            id_tester=other_tester,
            status=Postulation.State.ACCEPTED,
        )
        Rating.objects.create(
            id_postulation=other_postulation,
            stars=3,
            comment="Another tester rating.",
        )
        self.client.force_authenticate(user=self.tester_user)
        url = reverse("my-reputation")

        # Act
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_ratings"], 1)
        self.assertEqual(
            response.data["ratings"][0]["id_rating"],
            own_rating.id_rating,
        )

    def test_my_reputation_post_method_is_not_allowed(self):
        # Arrange
        self.client.force_authenticate(user=self.tester_user)
        url = reverse("my-reputation")

        # Act
        response = self.client.post(url, {}, format="json")

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

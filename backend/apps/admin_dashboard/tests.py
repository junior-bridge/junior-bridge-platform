from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.projects.models import Project
from apps.users.models import User


class AdminStatsAPITests(APITestCase):
    def setUp(self):
        self.url = reverse('admin-stats')
        self.admin_user = User.objects.create_user(
            email='stats-admin@example.com',
            password='test-password',
            name='Stats',
            surname='Admin',
            role=User.Role.ADMIN,
        )
        self.client_user = User.objects.create_user(
            email='stats-client@example.com',
            password='test-password',
            name='Stats',
            surname='Client',
            role=User.Role.CLIENT,
        )
        self.tester_user = User.objects.create_user(
            email='stats-tester@example.com',
            password='test-password',
            name='Stats',
            surname='Tester',
            role=User.Role.TESTER,
        )
        Project.objects.create(
            title='Active project',
            description='Project used for admin statistics.',
            repository='https://example.com/repository',
            demo_url='https://example.com/demo',
            technologies='Django, Next.js',
            modality='REMOTE',
            state='OPEN',
            client=self.client_user,
        )

    @patch(
        'apps.admin_dashboard.views.reports_collection.count_documents',
        return_value=0,
    )
    def test_admin_can_get_platform_stats(self, _count_documents):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)

        # Act
        response = self.client.get(self.url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['registered_users'], 3)
        self.assertEqual(response.data['active_projects'], 1)
        self.assertEqual(response.data['active_testers'], 1)
        self.assertEqual(response.data['reported_bugs'], 0)

    def test_anonymous_user_cannot_get_admin_stats(self):
        # Arrange
        self.client.force_authenticate(user=None)

        # Act
        response = self.client.get(self.url)

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_non_admin_user_cannot_get_admin_stats(self):
        # Arrange
        self.client.force_authenticate(user=self.client_user)

        # Act
        response = self.client.get(self.url)

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_post_method_is_not_allowed(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)

        # Act
        response = self.client.post(self.url, {}, format='json')

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import Project


class ProjectCreateTests(APITestCase):
    def setUp(self):
        self.url = reverse('project-create')
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='test-password',
            name='Client',
            surname='User',
            role=User.Role.CLIENT,
        )
        self.tester_user = User.objects.create_user(
            email='tester@example.com',
            password='test-password',
            name='Tester',
            surname='User',
            role=User.Role.TESTER,
        )
        self.project_data = {
            'title': 'FinTech Mobile App',
            'description': 'Application for financial transactions.',
            'repository': 'https://github.com/example/fintech-app',
            'demo_url': 'https://example.com/fintech-app',
            'technologies': 'Flutter, Node.js, Firebase',
            'modality': 'REMOTE',
        }

    def test_client_can_create_project(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.post(self.url, self.project_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get()
        self.assertEqual(project.client, self.client_user)
        self.assertEqual(project.state, 'PENDING')

    def test_client_and_state_are_assigned_by_backend(self):
        self.client.force_authenticate(user=self.client_user)
        data = {
            **self.project_data,
            'client': self.tester_user.id,
            'state': 'COMPLETED',
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get()
        self.assertEqual(project.client, self.client_user)
        self.assertEqual(project.state, 'PENDING')

    def test_tester_cannot_create_project(self):
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.post(self.url, self.project_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Project.objects.exists())

    def test_anonymous_user_cannot_create_project(self):
        response = self.client.post(self.url, self.project_data, format='json')

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )
        self.assertFalse(Project.objects.exists())

    def test_required_fields_are_validated(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Project.objects.exists())

    def test_repository_must_be_a_valid_url(self):
        self.client.force_authenticate(user=self.client_user)
        data = {**self.project_data, 'repository': 'not-a-url'}

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Project.objects.exists())


class ProjectStatusUpdateTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email='client-status@example.com',
            password='test-password',
            name='Client',
            surname='User',
            role=User.Role.CLIENT,
        )
        self.tester_user = User.objects.create_user(
            email='tester-status@example.com',
            password='test-password',
            name='Tester',
            surname='User',
            role=User.Role.TESTER,
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='test-password',
            name='Admin',
            surname='User',
            role=User.Role.ADMIN,
        )
        self.project = Project.objects.create(
            title='FinTech Mobile App',
            description='Application for financial transactions.',
            repository='https://github.com/example/fintech-app',
            demo_url='https://example.com/fintech-app',
            technologies='Flutter, Node.js, Firebase',
            modality='REMOTE',
            client=self.client_user,
        )
        self.url = reverse(
            'project-status-update',
            kwargs={'pk': self.project.pk},
        )

    def test_admin_can_approve_pending_project(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(
            self.url,
            {'state': 'OPEN'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'OPEN')

    def test_admin_can_reject_pending_project(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(
            self.url,
            {'state': 'REJECTED'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'REJECTED')

    def test_client_cannot_update_project_status(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.patch(
            self.url,
            {'state': 'OPEN'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'PENDING')

    def test_tester_cannot_update_project_status(self):
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.patch(
            self.url,
            {'state': 'OPEN'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'PENDING')

    def test_anonymous_user_cannot_update_project_status(self):
        response = self.client.patch(
            self.url,
            {'state': 'OPEN'},
            format='json',
        )

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'PENDING')

    def test_admin_cannot_use_invalid_status(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(
            self.url,
            {'state': 'COMPLETED'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'PENDING')

    def test_processed_project_cannot_be_updated_again(self):
        self.client.force_authenticate(user=self.admin_user)
        self.project.state = 'OPEN'
        self.project.save()

        response = self.client.patch(
            self.url,
            {'state': 'REJECTED'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.project.refresh_from_db()
        self.assertEqual(self.project.state, 'OPEN')

    def test_nonexistent_project_returns_not_found(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-status-update', kwargs={'pk': 9999})

        response = self.client.patch(url, {'state': 'OPEN'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

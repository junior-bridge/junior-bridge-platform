from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.projects.models import Project
from apps.users.models import User

from .models import Postulation


class PostulationTests(APITestCase):
    def setUp(self):
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
        self.other_tester = User.objects.create_user(
            email='other-tester@example.com',
            password='test-password',
            name='Other',
            surname='Tester',
            role=User.Role.TESTER,
        )
        self.project = Project.objects.create(
            title='Open project',
            description='Project available for testers.',
            repository='https://example.com/repository',
            demo_url='https://example.com/demo',
            technologies='Django, Next.js',
            modality='REMOTE',
            state='OPEN',
            client=self.client_user,
        )
        self.create_url = reverse(
            'project-postulation-create',
            kwargs={'id_project': self.project.pk},
        )

    def create_postulation(self, postulation_status=Postulation.State.PENDING):
        return Postulation.objects.create(
            id_project=self.project,
            id_tester=self.tester_user,
            status=postulation_status,
        )

    def test_tester_can_apply_to_open_project(self):
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.post(self.create_url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Postulation.objects.count(), 1)

    def test_tester_cannot_apply_to_project_that_is_not_open(self):
        self.project.state = 'PENDING'
        self.project.save()
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.post(self.create_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Postulation.objects.exists())

    def test_tester_cannot_apply_twice(self):
        self.create_postulation()
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.post(self.create_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Postulation.objects.count(), 1)

    def test_tester_can_view_own_postulation_detail(self):
        postulation = self.create_postulation()
        url = reverse(
            'postulation-detail',
            kwargs={'id_postulation': postulation.pk},
        )
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_title'], self.project.title)
        self.assertEqual(response.data['tester_name'], 'Tester User')

    def test_other_tester_cannot_view_postulation_detail(self):
        postulation = self.create_postulation()
        url = reverse(
            'postulation-detail',
            kwargs={'id_postulation': postulation.pk},
        )
        self.client.force_authenticate(user=self.other_tester)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tester_can_withdraw_pending_postulation(self):
        postulation = self.create_postulation()
        url = reverse(
            'postulation-detail',
            kwargs={'id_postulation': postulation.pk},
        )
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Postulation.objects.exists())

    def test_processed_postulation_cannot_change_or_be_withdrawn(self):
        postulation = self.create_postulation(Postulation.State.ACCEPTED)
        detail_url = reverse(
            'postulation-detail',
            kwargs={'id_postulation': postulation.pk},
        )
        reject_url = reverse(
            'postulation-reject',
            kwargs={'id_postulation': postulation.pk},
        )

        self.client.force_authenticate(user=self.tester_user)
        delete_response = self.client.delete(detail_url)

        self.client.force_authenticate(user=self.client_user)
        reject_response = self.client.post(reject_url)

        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(reject_response.status_code, status.HTTP_400_BAD_REQUEST)
        postulation.refresh_from_db()
        self.assertEqual(postulation.status, Postulation.State.ACCEPTED)

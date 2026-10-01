from uuid import uuid4

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.postulations.models import Postulation
from apps.projects.models import Project
from apps.users.models import User

from .mongodb import reports_collection


class ReportCreateTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email='report-client@example.com',
            password='test-password',
            name='Report',
            surname='Client',
            role=User.Role.CLIENT,
        )
        self.tester_user = User.objects.create_user(
            email='report-tester@example.com',
            password='test-password',
            name='Report',
            surname='Tester',
            role=User.Role.TESTER,
        )

        self.project = Project.objects.create(
            title='Report Test Project',
            description='Project for report tests.',
            repository='https://github.com/example/report-test',
            demo_url='https://example.com/report-test',
            technologies='Django, React',
            modality='REMOTE',
            state='OPEN',
            client=self.client_user,
        )

        self.postulation = Postulation.objects.create(
            id_project=self.project,
            id_tester=self.tester_user,
            status=Postulation.State.ACCEPTED,
        )

        self.url = reverse(
            'postulation-reports',
            kwargs={'postulation_id': self.postulation.id_postulation},
        )

        self.report_title = f'__TEST_REPORT_{uuid4()}__'

        self.report_data = {
            'title': self.report_title,
            'description': 'Report created during automated tests.',
            'severity': 'high',
            'steps_to_reproduce': [
                'Open the application.',
                'Go to projects.',
                'Submit a report.',
            ],
            'capture_evidence': 'https://example.com/evidence.png',
        }

    def tearDown(self):
        reports_collection.delete_many({
            'title': self.report_title,
        })

    def test_tester_can_create_report_for_accepted_postulation(self):
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.post(
            self.url,
            self.report_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('_id', response.data)

    def test_report_is_saved_in_mongodb(self):
        self.client.force_authenticate(user=self.tester_user)

        response = self.client.post(
            self.url,
            self.report_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        report = reports_collection.find_one({
            'title': self.report_title,
        })

        self.assertIsNotNone(report)
        self.assertEqual(
            report['id_postulation'],
            self.postulation.id_postulation,
        )
        self.assertEqual(report['severity'], 'high')

    def test_rejected_postulation_cannot_create_report(self):
        rejected_postulation = Postulation.objects.create(
            id_project=self.project,
            id_tester=User.objects.create_user(
                email='rejected-tester@example.com',
                password='test-password',
                name='Rejected',
                surname='Tester',
                role=User.Role.TESTER,
            ),
            status=Postulation.State.REJECTED,
        )

        url = reverse(
            'postulation-reports',
            kwargs={
                'postulation_id': rejected_postulation.id_postulation,
            },
        )

        self.client.force_authenticate(
            user=rejected_postulation.id_tester
        )

        response = self.client.post(
            url,
            self.report_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'Only accepted postulations can create reports.',
        )

    def test_client_cannot_create_report(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.post(
            self.url,
            self.report_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_postulation_returns_not_found(self):
        self.client.force_authenticate(user=self.tester_user)

        url = reverse(
            'postulation-reports',
            kwargs={'postulation_id': 999999},
        )

        response = self.client.post(
            url,
            self.report_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_report_data_returns_bad_request(self):
        self.client.force_authenticate(user=self.tester_user)

        invalid_data = {
            **self.report_data,
            'severity': 'invalid',
        }

        response = self.client.post(
            self.url,
            invalid_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            reports_collection.find_one({
                'title': self.report_title,
            })
        )
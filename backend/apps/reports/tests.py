from io import BytesIO
from uuid import uuid4
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from PIL import Image

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

    @staticmethod
    def create_test_image(name):
        image_buffer = BytesIO()
        Image.new('RGB', (1, 1), color='red').save(
            image_buffer,
            format='PNG',
        )
        return SimpleUploadedFile(
            name,
            image_buffer.getvalue(),
            content_type='image/png',
        )

    def tearDown(self):
        reports_collection.delete_many({
            'title': {
                '$in': [
                    self.report_title,
                    f'{self.report_title}_unrelated',
                ],
            },
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
        self.assertEqual(
            response.data['_id'],
            str(
                reports_collection.find_one(
                    {'title': self.report_title}
                )['_id']
            ),
        )
        self.assertEqual(
            response.data['id_postulation'],
            self.postulation.id_postulation,
        )

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

    def test_client_can_list_reports_for_owned_projects(self):
        reports_collection.insert_one({
            'title': self.report_title,
            'description': self.report_data['description'],
            'severity': self.report_data['severity'],
            'steps_to_reproduce': self.report_data['steps_to_reproduce'],
            'id_postulation': self.postulation.id_postulation,
        })
        reports_collection.insert_one({
            'title': f'{self.report_title}_unrelated',
            'description': 'Report from another project.',
            'severity': 'low',
            'steps_to_reproduce': [],
            'id_postulation': -1,
        })
        self.client.force_authenticate(user=self.client_user)

        response = self.client.get(reverse('report-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(
            report['title'] == self.report_title
            and report['id_postulation'] == self.postulation.id_postulation
            for report in response.data
        ))
        self.assertFalse(any(
            report['title'] == f'{self.report_title}_unrelated'
            for report in response.data
        ))

    def test_admin_can_list_all_reports(self):
        reports_collection.insert_one({
            'title': self.report_title,
            'description': self.report_data['description'],
            'severity': self.report_data['severity'],
            'steps_to_reproduce': self.report_data['steps_to_reproduce'],
            'id_postulation': self.postulation.id_postulation,
        })
        admin_user = User.objects.create_user(
            email='report-admin@example.com',
            password='test-password',
            name='Report',
            surname='Admin',
            role=User.Role.ADMIN,
        )
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(reverse('report-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(
            report['title'] == self.report_title
            for report in response.data
        ))

    @patch(
        'apps.reports.views.default_storage.save',
        side_effect=[
            'reports/evidence/evidence-1.png',
            'reports/evidence/evidence-2.png',
        ],
    )
    def test_tester_can_upload_multiple_evidence_images(
        self,
        save_image,
    ):
        self.client.force_authenticate(user=self.tester_user)
        multipart_data = {
            'title': self.report_title,
            'description': self.report_data['description'],
            'severity': self.report_data['severity'],
            'steps_to_reproduce': '["Open the application.", "Submit a report."]',
            'evidence_images': [
                self.create_test_image('evidence-1.png'),
                self.create_test_image('evidence-2.png'),
            ],
        }

        response = self.client.post(
            self.url,
            multipart_data,
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data['evidence_images'],
            [
                reverse(
                    'report-evidence',
                    kwargs={'id_report': response.data['_id'], 'index': 0},
                ),
                reverse(
                    'report-evidence',
                    kwargs={'id_report': response.data['_id'], 'index': 1},
                ),
            ],
        )
        report = reports_collection.find_one({'title': self.report_title})
        self.assertEqual(
            report['evidence_images'],
            [
                'reports/evidence/evidence-1.png',
                'reports/evidence/evidence-2.png',
            ],
        )
        self.assertEqual(save_image.call_count, 2)

    @patch(
        'apps.reports.views.default_storage.open',
        return_value=BytesIO(b'evidence'),
    )
    def test_evidence_image_requires_report_access(self, _open_image):
        self.client.force_authenticate(user=self.tester_user)
        report_id = reports_collection.insert_one({
            'title': self.report_title,
            'description': self.report_data['description'],
            'severity': self.report_data['severity'],
            'steps_to_reproduce': self.report_data['steps_to_reproduce'],
            'evidence_images': ['reports/evidence/private.png'],
            'id_postulation': self.postulation.id_postulation,
        }).inserted_id
        evidence_url = reverse(
            'report-evidence',
            kwargs={'id_report': str(report_id), 'index': 0},
        )

        response = self.client.get(evidence_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertEqual(response["Content-Disposition"], "inline")
        self.assertEqual(b''.join(response.streaming_content), b'evidence')

        other_tester = User.objects.create_user(
            email='other-tester@example.com',
            password='test-password',
            name='Other',
            surname='Tester',
            role=User.Role.TESTER,
        )
        self.client.force_authenticate(user=other_tester)
        forbidden_response = self.client.get(evidence_url)

        self.assertEqual(
            forbidden_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_report_rejects_more_than_five_evidence_images(self):
        self.client.force_authenticate(user=self.tester_user)
        multipart_data = {
            'title': self.report_title,
            'description': self.report_data['description'],
            'severity': self.report_data['severity'],
            'steps_to_reproduce': '["Open the application."]',
            'evidence_images': [
                self.create_test_image(f'evidence-{index}.png')
                for index in range(6)
            ],
        }

        response = self.client.post(
            self.url,
            multipart_data,
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('evidence_images', response.data)
        self.assertFalse(
            reports_collection.find_one({'title': self.report_title})
        )

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
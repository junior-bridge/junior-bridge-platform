import http.client
import json
import socket
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User

from .models import Project, ProjectAudit
from .pagespeed import PageSpeedError, fetch_pagespeed_scores, run_project_audit


SAMPLE_PSI_RESPONSE = {
    'lighthouseResult': {
        'categories': {
            'performance': {'score': 0.87},
            'accessibility': {'score': 1},
            'best-practices': {'score': 0.5},
            'seo': {'score': None},
        }
    }
}

SAMPLE_SCORES = {
    'performance': 90,
    'accessibility': 95,
    'best_practices': 80,
    'seo': 100,
}


def make_user(email, role):
    return User.objects.create_user(
        email=email,
        password='test-password',
        name='Test',
        surname='User',
        role=role,
    )


def make_project(client_user):
    return Project.objects.create(
        title='Demo App',
        description='App under test.',
        repository='https://github.com/example/demo',
        demo_url='https://example.com/demo',
        technologies='Django',
        modality='REMOTE',
        client=client_user,
    )


def mock_urlopen_response(payload):
    response = MagicMock()
    body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
    response.read.return_value = body
    response.__enter__.return_value = response
    response.__exit__.return_value = False
    return response


class FetchPageSpeedScoresTests(TestCase):
    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_parses_scores_as_integers_from_zero_to_one_hundred(self, urlopen):
        # Arrange
        urlopen.return_value = mock_urlopen_response(SAMPLE_PSI_RESPONSE)

        # Act
        scores = fetch_pagespeed_scores('https://example.com', 'MOBILE')

        # Assert
        self.assertEqual(
            scores,
            {
                'performance': 87,
                'accessibility': 100,
                'best_practices': 50,
                'seo': None,
            },
        )

    @override_settings(PAGESPEED_API_KEY='', PAGESPEED_TIMEOUT=7)
    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_builds_query_without_key_when_not_configured(self, urlopen):
        # Arrange
        urlopen.return_value = mock_urlopen_response(SAMPLE_PSI_RESPONSE)

        fetch_pagespeed_scores('https://example.com', 'DESKTOP')

        # Act
        request_url = urlopen.call_args.args[0]
        query = parse_qs(urlparse(request_url).query)
        # Assert
        self.assertEqual(query['url'], ['https://example.com'])
        self.assertEqual(query['strategy'], ['desktop'])
        self.assertEqual(
            query['category'],
            ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'],
        )
        self.assertNotIn('key', query)
        self.assertEqual(urlopen.call_args.kwargs['timeout'], 7)

    @override_settings(PAGESPEED_API_KEY='secret-key')
    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_includes_key_when_configured(self, urlopen):
        # Arrange
        urlopen.return_value = mock_urlopen_response(SAMPLE_PSI_RESPONSE)

        fetch_pagespeed_scores('https://example.com', 'MOBILE')

        # Act
        query = parse_qs(urlparse(urlopen.call_args.args[0]).query)
        # Assert
        self.assertEqual(query['key'], ['secret-key'])

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_network_error(self, urlopen):
        # Arrange
        # Act
        urlopen.side_effect = URLError('unreachable')

        # Assert
        with self.assertRaises(PageSpeedError):
            fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_timeout(self, urlopen):
        # Arrange
        # Act
        urlopen.side_effect = socket.timeout('timed out')

        # Assert
        with self.assertRaises(PageSpeedError):
            fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_http_error(self, urlopen):
        # Arrange
        # Act
        urlopen.side_effect = HTTPError(
            'https://www.googleapis.com', 429, 'Too Many Requests', {}, None
        )

        # Assert
        with self.assertRaises(PageSpeedError):
            fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_invalid_json(self, urlopen):
        # Arrange
        # Act
        urlopen.return_value = mock_urlopen_response(b'not json')

        # Assert
        with self.assertRaises(PageSpeedError):
            fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_when_lighthouse_result_is_missing(self, urlopen):
        # Arrange
        # Act
        urlopen.return_value = mock_urlopen_response({'id': 'x'})

        # Assert
        with self.assertRaises(PageSpeedError):
            fetch_pagespeed_scores('https://example.com', 'MOBILE')


class FetchPageSpeedScoresRobustnessTests(TestCase):
    """Every PSI failure must surface as PageSpeedError, never a raw exception."""

    TRANSPORT_ERRORS = [
        http.client.RemoteDisconnected('Remote end closed connection'),
        http.client.IncompleteRead(b'partial'),
        http.client.BadStatusLine('garbage'),
        ConnectionResetError('connection reset by peer'),
        OSError('network is unreachable'),
    ]

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_transport_error_when_opening(self, urlopen):
        # Arrange
        # Act
        for error in self.TRANSPORT_ERRORS:
            with self.subTest(error=type(error).__name__):
                urlopen.side_effect = error

        # Assert
                with self.assertRaises(PageSpeedError):
                    fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_transport_error_while_reading(self, urlopen):
        # Arrange
        # Act
        for error in self.TRANSPORT_ERRORS:
            with self.subTest(error=type(error).__name__):
                response = mock_urlopen_response(b'')
                response.read.side_effect = error
                urlopen.side_effect = None
                urlopen.return_value = response

        # Assert
                with self.assertRaises(PageSpeedError):
                    fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_raises_on_malformed_categories(self, urlopen):
        # Arrange
        # Act
        malformed_payloads = {
            'categories is a list': {'lighthouseResult': {'categories': ['performance']}},
            'categories is a string': {'lighthouseResult': {'categories': 'oops'}},
            'category is a list': {
                'lighthouseResult': {'categories': {'performance': [0.9]}}
            },
            'category is a number': {
                'lighthouseResult': {'categories': {'seo': 0.9}}
            },
            'score is a string': {
                'lighthouseResult': {
                    'categories': {'performance': {'score': 'high'}}
                }
            },
            'score is out of range': {
                'lighthouseResult': {
                    'categories': {'performance': {'score': 7}}
                }
            },
        }
        for label, payload in malformed_payloads.items():
            with self.subTest(payload=label):
                urlopen.return_value = mock_urlopen_response(payload)

        # Assert
                with self.assertRaises(PageSpeedError):
                    fetch_pagespeed_scores('https://example.com', 'MOBILE')

    @patch('apps.projects.pagespeed.urllib.request.urlopen')
    def test_missing_categories_yield_empty_scores(self, urlopen):
        # Arrange
        urlopen.return_value = mock_urlopen_response({'lighthouseResult': {}})

        # Act
        scores = fetch_pagespeed_scores('https://example.com', 'MOBILE')

        # Assert
        self.assertEqual(
            scores,
            {
                'performance': None,
                'accessibility': None,
                'best_practices': None,
                'seo': None,
            },
        )


class RunProjectAuditTests(TestCase):
    def setUp(self):
        self.owner = make_user('owner@example.com', User.Role.CLIENT)
        self.project = make_project(self.owner)

    @patch('apps.projects.pagespeed.fetch_pagespeed_scores')
    def test_stores_successful_audit_with_scores(self, fetch):
        # Arrange
        fetch.return_value = SAMPLE_SCORES

        # Act
        audit = run_project_audit(self.project, self.owner, 'DESKTOP')

        # Assert
        fetch.assert_called_once_with('https://example.com/demo', 'DESKTOP')
        self.assertEqual(audit.status, ProjectAudit.Status.SUCCESS)
        self.assertEqual(audit.strategy, ProjectAudit.Strategy.DESKTOP)
        self.assertEqual(audit.performance, 90)
        self.assertEqual(audit.best_practices, 80)
        self.assertEqual(audit.requested_by, self.owner)
        self.assertEqual(ProjectAudit.objects.count(), 1)

    @patch('apps.projects.pagespeed.fetch_pagespeed_scores')
    def test_stores_failed_audit_on_error(self, fetch):
        # Arrange
        # Act
        fetch.side_effect = PageSpeedError('PSI unavailable')

        # Assert
        with self.assertLogs('apps.projects.pagespeed', level='WARNING'):
            audit = run_project_audit(self.project, self.owner)

        self.assertEqual(audit.status, ProjectAudit.Status.FAILED)
        self.assertEqual(audit.error_message, 'PSI unavailable')
        self.assertIsNone(audit.performance)
        self.assertEqual(ProjectAudit.objects.count(), 1)


@patch('apps.projects.pagespeed.fetch_pagespeed_scores')
class ProjectAuditViewTests(APITestCase):
    def setUp(self):
        self.owner = make_user('owner@example.com', User.Role.CLIENT)
        self.other_client = make_user('other@example.com', User.Role.CLIENT)
        self.tester = make_user('tester@example.com', User.Role.TESTER)
        self.admin = make_user('admin@example.com', User.Role.ADMIN)
        self.project = make_project(self.owner)
        self.url = reverse('project-audit', kwargs={'pk': self.project.pk})

    def test_owner_can_run_audit(self, fetch):
        # Arrange
        fetch.return_value = SAMPLE_SCORES
        self.client.force_authenticate(user=self.owner)

        # Act
        response = self.client.post(self.url, {}, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'SUCCESS')
        self.assertEqual(response.data['performance'], 90)
        self.assertEqual(response.data['strategy'], 'MOBILE')
        self.assertEqual(self.project.audits.count(), 1)

    def test_admin_can_run_audit_with_strategy(self, fetch):
        # Arrange
        fetch.return_value = SAMPLE_SCORES
        self.client.force_authenticate(user=self.admin)

        # Act
        response = self.client.post(
            self.url, {'strategy': 'DESKTOP'}, format='json'
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['strategy'], 'DESKTOP')
        fetch.assert_called_once_with('https://example.com/demo', 'DESKTOP')

    def test_other_client_cannot_run_audit(self, fetch):
        # Arrange
        self.client.force_authenticate(user=self.other_client)

        # Act
        response = self.client.post(self.url, {}, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        fetch.assert_not_called()
        self.assertFalse(ProjectAudit.objects.exists())

    def test_tester_cannot_run_audit(self, fetch):
        # Arrange
        self.client.force_authenticate(user=self.tester)

        # Act
        response = self.client.post(self.url, {}, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        fetch.assert_not_called()

    def test_pagespeed_failure_returns_bad_gateway(self, fetch):
        # Arrange
        # Act
        fetch.side_effect = PageSpeedError('PSI unavailable')
        self.client.force_authenticate(user=self.owner)

        # Assert
        with self.assertLogs('apps.projects.pagespeed', level='WARNING'):
            response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.data['status'], 'FAILED')
        audit = self.project.audits.get()
        self.assertEqual(audit.status, ProjectAudit.Status.FAILED)

    def test_invalid_strategy_returns_bad_request(self, fetch):
        # Arrange
        self.client.force_authenticate(user=self.owner)

        # Act
        response = self.client.post(
            self.url, {'strategy': 'TABLET'}, format='json'
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        fetch.assert_not_called()

    def test_post_to_missing_project_returns_not_found(self, fetch):
        # Arrange
        self.client.force_authenticate(user=self.admin)
        url = reverse('project-audit', kwargs={'pk': 9999})

        # Act
        response = self.client.post(url, {}, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_tester_can_read_latest_audit(self, fetch):
        # Arrange
        ProjectAudit.objects.create(
            project=self.project,
            status=ProjectAudit.Status.SUCCESS,
            performance=40,
        )
        latest = ProjectAudit.objects.create(
            project=self.project,
            status=ProjectAudit.Status.SUCCESS,
            performance=75,
        )
        self.client.force_authenticate(user=self.tester)

        # Act
        response = self.client.get(self.url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], latest.id)
        self.assertEqual(response.data['performance'], 75)

    def test_get_without_audits_returns_not_found(self, fetch):
        # Arrange
        self.client.force_authenticate(user=self.tester)

        # Act
        response = self.client.get(self.url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', response.data)

    def test_get_missing_project_returns_not_found(self, fetch):
        # Arrange
        self.client.force_authenticate(user=self.tester)
        url = reverse('project-audit', kwargs={'pk': 9999})

        # Act
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_cannot_run_audit(self, fetch):
        # Arrange
        # Act
        response = self.client.post(self.url, {}, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        fetch.assert_not_called()
        self.assertFalse(ProjectAudit.objects.exists())

    def test_unauthenticated_user_cannot_read_audit(self, fetch):
        # Arrange
        # Act
        response = self.client.get(self.url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_transport_error_while_reading_returns_bad_gateway(self, fetch):
        # Arrange
        fetch.side_effect = None
        self.client.force_authenticate(user=self.owner)
        response_mock = mock_urlopen_response(b'')
        response_mock.read.side_effect = http.client.IncompleteRead(b'partial')

        # Act
        with patch(
            'apps.projects.pagespeed.fetch_pagespeed_scores',
            wraps=fetch_pagespeed_scores,
        ), patch(
            'apps.projects.pagespeed.urllib.request.urlopen',
            return_value=response_mock,
        ), self.assertLogs('apps.projects.pagespeed', level='WARNING'):
            response = self.client.post(self.url, {}, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.data['status'], 'FAILED')
        self.assertTrue(response.data['error_message'])

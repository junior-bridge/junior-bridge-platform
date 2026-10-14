from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from apps.notifications.models import Notification
from apps.postulations.models import Postulation
from apps.projects.models import Project
from apps.users.models import User


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'
)
@patch('apps.notifications.signals.async_to_sync')
@patch('apps.notifications.signals.get_channel_layer')
@patch('apps.notifications.signals.send_notification_email')
class ProjectCompletedNotificationTests(TestCase):
    """A project moving to COMPLETED notifies every accepted tester once."""

    def setUp(self):
        self.client_user = self.create_user('client@example.com', User.Role.CLIENT)
        self.accepted_tester = self.create_user('accepted@example.com', User.Role.TESTER)
        self.pending_tester = self.create_user('pending@example.com', User.Role.TESTER)
        self.rejected_tester = self.create_user('rejected@example.com', User.Role.TESTER)
        self.project = Project.objects.create(
            title='Completed project',
            description='Project for completion notification tests.',
            repository='https://example.com/repository',
            demo_url='https://example.com/demo',
            technologies='Django',
            modality='REMOTE',
            state='IN_PROGRESS',
            client=self.client_user,
        )
        # Postulations are created with their final status directly so no
        # postulation notifications are triggered by status transitions.
        for tester, status in (
            (self.accepted_tester, Postulation.State.ACCEPTED),
            (self.pending_tester, Postulation.State.PENDING),
            (self.rejected_tester, Postulation.State.REJECTED),
        ):
            Postulation.objects.create(
                id_project=self.project,
                id_tester=tester,
                status=status,
            )

    def create_user(self, email, role):
        return User.objects.create_user(
            email=email,
            password='test-password',
            name=email.split('@')[0].capitalize(),
            surname='User',
            role=role,
        )

    def completion_notifications(self):
        return Notification.objects.filter(type='project_completed')

    def complete_project(self):
        with self.captureOnCommitCallbacks(execute=True):
            self.project.state = 'COMPLETED'
            self.project.save()

    def test_completion_notifies_and_emails_accepted_tester(
        self, mock_send_email, mock_get_channel_layer, mock_async_to_sync
    ):
        group_send = MagicMock()
        mock_async_to_sync.return_value = group_send

        self.complete_project()

        notification = self.completion_notifications().get()
        self.assertEqual(notification.id_user, self.accepted_tester)
        self.assertIn(self.project.title, notification.message)

        group_send.assert_called_once()
        group_name = group_send.call_args.args[0]
        self.assertEqual(group_name, f'user_{self.accepted_tester.id}_notifications')

        mock_send_email.assert_called_once()
        email_kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(email_kwargs['user'], self.accepted_tester)
        self.assertIn('finalizado', email_kwargs['subject'].lower())
        self.assertIn(self.project.title, email_kwargs['message'])

    def test_non_accepted_testers_get_nothing(
        self, mock_send_email, mock_get_channel_layer, mock_async_to_sync
    ):
        self.complete_project()

        notified_users = set(
            self.completion_notifications().values_list('id_user', flat=True)
        )
        self.assertNotIn(self.pending_tester.id, notified_users)
        self.assertNotIn(self.rejected_tester.id, notified_users)
        emailed_users = {c.kwargs['user'] for c in mock_send_email.call_args_list}
        self.assertEqual(emailed_users, {self.accepted_tester})

    def test_resaving_completed_project_sends_nothing(
        self, mock_send_email, mock_get_channel_layer, mock_async_to_sync
    ):
        self.complete_project()
        mock_send_email.reset_mock()

        with self.captureOnCommitCallbacks(execute=True):
            self.project.title = 'Renamed completed project'
            self.project.save()

        self.assertEqual(self.completion_notifications().count(), 1)
        mock_send_email.assert_not_called()

    def test_other_state_changes_send_nothing(
        self, mock_send_email, mock_get_channel_layer, mock_async_to_sync
    ):
        with self.captureOnCommitCallbacks(execute=True):
            self.project.state = 'IN_REVIEW'
            self.project.save()

        self.assertFalse(self.completion_notifications().exists())
        mock_send_email.assert_not_called()

    def test_complete_endpoint_notifies_accepted_tester(
        self, mock_send_email, mock_get_channel_layer, mock_async_to_sync
    ):
        api = APIClient()
        api.force_authenticate(user=self.client_user)
        url = reverse('project-complete', kwargs={'pk': self.project.pk})

        with self.captureOnCommitCallbacks(execute=True):
            response = api.post(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            list(self.completion_notifications().values_list('id_user', flat=True)),
            [self.accepted_tester.id],
        )
        mock_send_email.assert_called_once()
        self.assertEqual(mock_send_email.call_args.kwargs['user'], self.accepted_tester)

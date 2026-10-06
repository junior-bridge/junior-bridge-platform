from django.core import mail
from django.test import TestCase, override_settings

from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from config.routing import websocket_urlpatterns

from apps.notifications.models import Notification
from apps.postulations.models import Postulation
from apps.projects.models import Project
from apps.users.models import User
from unittest.mock import MagicMock, patch

@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'
)

class NotificationSignalTests(TestCase):

    @patch('apps.notifications.signals.send_notification_email')
    @patch('apps.notifications.signals.get_channel_layer')
    @patch('apps.notifications.signals.async_to_sync')
    def test_accepted_postulation_triggers_notification_websocket_and_email(
        self,
        mock_async_to_sync,
        mock_get_channel_layer,
        mock_send_email,
    ):
        channel_layer = MagicMock()
        group_send = MagicMock()

        mock_get_channel_layer.return_value = channel_layer
        mock_async_to_sync.return_value = group_send

        postulation = self.create_postulation()

        mock_get_channel_layer.reset_mock()
        mock_async_to_sync.reset_mock()
        group_send.reset_mock()
        mock_send_email.reset_mock()

        with self.captureOnCommitCallbacks(execute=True):
            postulation.status = Postulation.State.ACCEPTED
            postulation.save()

        self.assertTrue(
            Notification.objects.filter(
                id_user=self.tester_user,
                type='message',
                message__contains='aceptada',
            ).exists()
        )

        mock_get_channel_layer.assert_called_once()
        mock_async_to_sync.assert_called_once()
        group_send.assert_called_once()
        mock_send_email.assert_called_once()

        email_kwargs = mock_send_email.call_args.kwargs

        self.assertEqual(email_kwargs['user'], self.tester_user)
        self.assertIn('aceptada', email_kwargs['subject'])

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
        self.project = Project.objects.create(
            title='Test project',
            description='Project for notification tests.',
            repository='https://example.com/repository',
            demo_url='https://example.com/demo',
            technologies='Django',
            modality='REMOTE',
            state='OPEN',
            client=self.client_user,
        )

    def create_postulation(self):
        return Postulation.objects.create(
            id_project=self.project,
            id_tester=self.tester_user,
            status=Postulation.State.PENDING,
        )

    def test_accepted_postulation_creates_notification_and_email(self):
        postulation = self.create_postulation()

        with self.captureOnCommitCallbacks(execute=True):
            postulation.status = Postulation.State.ACCEPTED
            postulation.save()

        notification = Notification.objects.filter(
            id_user=self.tester_user,
            type='message',
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn('aceptada', notification.message)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.tester_user.email])
        self.assertIn('aceptada', mail.outbox[0].subject)

    def test_rejected_postulation_creates_notification_and_email(self):
        postulation = self.create_postulation()

        with self.captureOnCommitCallbacks(execute=True):
            postulation.status = Postulation.State.REJECTED
            postulation.save()

        notification = Notification.objects.filter(
            id_user=self.tester_user,
            type='message',
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn('rechazada', notification.message)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.tester_user.email])
        self.assertIn('rechazada', mail.outbox[0].subject)

    def test_accepted_postulation_does_not_duplicate_notification_or_email(self):
        postulation = self.create_postulation()

        with self.captureOnCommitCallbacks(execute=True):
            postulation.status = Postulation.State.ACCEPTED
            postulation.save()

        notification_count = Notification.objects.filter(
            id_user=self.tester_user,
            type='message',
        ).count()
        email_count = len(mail.outbox)

        with self.captureOnCommitCallbacks(execute=True):
            postulation.save()

        self.assertEqual(
            Notification.objects.filter(
                id_user=self.tester_user,
                type='message',
            ).count(),
            notification_count,
        )
        self.assertEqual(len(mail.outbox), email_count)

@override_settings(
    CHANNEL_LAYERS={
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }
)
class NotificationWebSocketTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='websocket@example.com',
            password='test-password',
            name='WebSocket',
            surname='Tester',
            role=User.Role.TESTER,
        )
        self.test_application = URLRouter(websocket_urlpatterns)

    def create_communicator(self, user=None):
        communicator = WebsocketCommunicator(
            self.test_application,
            '/ws/notifications/',
        )
        communicator.scope['user'] = user
        return communicator

    async def test_authenticated_user_can_connect(self):
        communicator = self.create_communicator(self.user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        response = await communicator.receive_json_from()

        self.assertEqual(
            response,
            {
                'type': 'connection_established',
                'message': 'Conectado',
                'user_id': self.user.id,
            },
        )

        await communicator.disconnect()

    async def test_ping_returns_pong(self):
        communicator = self.create_communicator(self.user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.receive_json_from()

        await communicator.send_json_to({
            'type': 'ping',
        })

        response = await communicator.receive_json_from()
        self.assertEqual(
            response,
            {
                'type': 'pong',
            },
        )

        await communicator.disconnect()

    async def test_notification_is_sent_to_user(self):
        communicator = self.create_communicator(self.user)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.receive_json_from()

        channel_layer = get_channel_layer()

        await channel_layer.group_send(
            f'user_{self.user.id}_notifications',
            {
                'type': 'notification_received',
                'notification_id': 123,
                'title': 'Postulación aceptada',
                'message': 'Tu postulación fue aceptada.',
                'notification_type': 'message',
            },
        )

        response = await communicator.receive_json_from()

        self.assertEqual(
            response,
            {
                'type': 'new_notification',
                'notification_id': 123,
                'title': 'Postulación aceptada',
                'message': 'Tu postulación fue aceptada.',
                'notification_type': 'message',
            },
        )

        await communicator.disconnect()

    async def test_unauthenticated_user_cannot_connect(self):
        from django.contrib.auth.models import AnonymousUser
        communicator = self.create_communicator(AnonymousUser())
        connected, _ = await communicator.connect()

        self.assertFalse(connected)
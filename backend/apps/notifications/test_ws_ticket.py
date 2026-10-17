import time
from unittest.mock import patch

from django.contrib.auth.models import AnonymousUser
from django.test import SimpleTestCase, TestCase

from rest_framework.test import APIClient

from apps.notifications.ws_ticket import (
    WS_TICKET_MAX_AGE_SECONDS,
    issue_ticket,
    user_id_from_ticket,
)
from apps.users.models import User
from config.asgi import JWTCookieAuthMiddleware


TICKET_URL = '/api/notifications/ws-ticket/'


class FakeUser:
    pk = 42


class WsTicketSigningTests(SimpleTestCase):
    def test_issued_ticket_round_trips_to_user_id(self):
        ticket = issue_ticket(FakeUser())

        self.assertEqual(user_id_from_ticket(ticket), 42)

    def test_tampered_ticket_returns_none(self):
        ticket = issue_ticket(FakeUser())
        tampered = ticket[:-1] + ('A' if ticket[-1] != 'A' else 'B')

        self.assertIsNone(user_id_from_ticket(tampered))

    def test_expired_ticket_returns_none(self):
        ticket = issue_ticket(FakeUser())
        later = time.time() + WS_TICKET_MAX_AGE_SECONDS + 5

        with patch('django.core.signing.time.time', return_value=later):
            self.assertIsNone(user_id_from_ticket(ticket))

    def test_garbage_returns_none(self):
        for value in ['', 'garbage', 'a:b:c', None, 123]:
            with self.subTest(value=value):
                self.assertIsNone(user_id_from_ticket(value))


class WsTicketViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='ticket@example.com',
            password='test-password',
            name='Ticket',
            surname='Tester',
            role=User.Role.TESTER,
        )

    def test_anonymous_user_is_rejected(self):
        response = self.client.get(TICKET_URL)

        self.assertIn(response.status_code, (401, 403))

    def test_authenticated_user_gets_ticket(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(TICKET_URL)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['expires_in'], WS_TICKET_MAX_AGE_SECONDS)
        self.assertEqual(user_id_from_ticket(response.json()['ticket']), self.user.pk)
        self.assertIn('no-store', response['Cache-Control'])


class WsTicketMiddlewareTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='middleware@example.com',
            password='test-password',
            name='Middleware',
            surname='Tester',
            role=User.Role.TESTER,
        )

    async def run_middleware(self, query_string):
        captured = {}

        async def inner(scope, receive, send):
            captured['user'] = scope['user']

        middleware = JWTCookieAuthMiddleware(inner)
        scope = {'type': 'websocket', 'headers': [], 'query_string': query_string}
        await middleware(scope, None, None)
        return captured['user']

    async def test_valid_ticket_without_cookie_sets_user(self):
        ticket = issue_ticket(self.user)

        user = await self.run_middleware(f'ticket={ticket}'.encode())

        self.assertEqual(user.pk, self.user.pk)

    async def test_invalid_ticket_leaves_anonymous_user(self):
        user = await self.run_middleware(b'ticket=not-a-valid-ticket')

        self.assertIsInstance(user, AnonymousUser)

    async def test_missing_ticket_leaves_anonymous_user(self):
        user = await self.run_middleware(b'')

        self.assertIsInstance(user, AnonymousUser)

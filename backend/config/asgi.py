import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from urllib.parse import parse_qs

from django.core.asgi import get_asgi_application
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.routing import ProtocolTypeRouter, URLRouter

django_asgi_app = get_asgi_application()

from config import routing
from apps.users.models import User
from apps.users.services import consume_ws_ticket


@database_sync_to_async
def get_user_from_token(token_str):
    try:
        from rest_framework_simplejwt.tokens import AccessToken

        access_token = AccessToken(token_str)
        user_id = access_token['user_id']

        return User.objects.get(id=user_id)
    except Exception:
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()


@database_sync_to_async
def get_user_from_id(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()


@sync_to_async
def consume_ticket(ticket):
    return consume_ws_ticket(ticket)


class JWTCookieAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser

        headers = dict(scope.get('headers', []))
        cookie_header = headers.get(b'cookie', b'').decode()

        user = AnonymousUser()

        query = parse_qs(scope.get('query_string', b'').decode())
        ticket = (query.get('ticket') or [None])[0]
        if ticket:
            user_id = await consume_ticket(ticket)
            if user_id is not None:
                user = await get_user_from_id(user_id)

        if user.is_anonymous:
            token = None
            if 'access_token=' in cookie_header:
                for cookie in cookie_header.split('; '):
                    if cookie.startswith('access_token='):
                        token = cookie.split('=', 1)[1]
                        break

            if token:
                user = await get_user_from_token(token)

        scope['user'] = user
        await self.inner(scope, receive, send)


application = ProtocolTypeRouter({
    "http": ASGIStaticFilesHandler(django_asgi_app),
    "websocket": JWTCookieAuthMiddleware(
        URLRouter(routing.websocket_urlpatterns)
    ),
})

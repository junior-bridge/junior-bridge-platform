import os
from urllib.parse import parse_qs
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.db import database_sync_to_async

django_asgi_app = get_asgi_application()

from config import routing

@database_sync_to_async
def get_user_from_token(token_str):
    try:
        from django.contrib.auth.models import AnonymousUser
        from rest_framework_simplejwt.tokens import AccessToken
        
        access_token = AccessToken(token_str)
        user_id = access_token['user_id']
        
        from apps.users.models import User
        user = User.objects.get(id=user_id)
        return user
    except Exception as e:
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()


@database_sync_to_async
def get_user_from_ticket(ticket):
    from django.contrib.auth.models import AnonymousUser
    from apps.notifications.ws_ticket import user_id_from_ticket
    from apps.users.models import User

    user_id = user_id_from_ticket(ticket)
    if user_id is None:
        return AnonymousUser()

    try:
        return User.objects.get(id=user_id, is_active=True)
    except User.DoesNotExist:
        return AnonymousUser()


def ticket_from_scope(scope):
    query = parse_qs(scope.get('query_string', b'').decode())
    values = query.get('ticket')
    return values[0] if values else None


class JWTCookieAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser
        
        headers = dict(scope.get('headers', []))
        cookie_header = headers.get(b'cookie', b'').decode()
        
        token = None
        
        if 'access_token=' in cookie_header:
            cookies = cookie_header.split('; ')
            for cookie in cookies:
                if cookie.startswith('access_token='):
                    token = cookie.split('=', 1)[1]
                    break
        
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            # Fallback for browsers that block the third-party cookie.
            ticket = ticket_from_scope(scope)
            if ticket:
                scope['user'] = await get_user_from_ticket(ticket)
            else:
                scope['user'] = AnonymousUser()
        
        await self.inner(scope, receive, send)


application = ProtocolTypeRouter({
    "http": ASGIStaticFilesHandler(django_asgi_app),
    "websocket": JWTCookieAuthMiddleware(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
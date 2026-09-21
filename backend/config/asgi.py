import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application
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
            scope['user'] = AnonymousUser()
        
        await self.inner(scope, receive, send)


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTCookieAuthMiddleware(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
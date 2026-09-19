"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# ═════════════════════════════════════════════════════════════════════════════
# ¿QUÉ ESTÁ PASANDO AQUÍ?
# ═════════════════════════════════════════════════════════════════════════════
#
# 1. get_asgi_application()
#    - Cargar toda la configuración de Django
#    - Esto es lo que hace que funcione Django
#
# 2. ProtocolTypeRouter
#    - Es un enrutador que dice:
#    - "Si es HTTP, usa Django normal"
#    - "Si es WebSocket, usa Channels"
#
# 3. AuthMiddlewareStack
#    - Middleware que extrae el token JWT de la conexión WebSocket
#    - Lo convierte en un usuario autenticado
#
# 4. URLRouter
#    - Enruta las WebSocket URLs a los Consumer correcto
#    - Necesita un archivo config/routing.py que crearemos después
#
# ═════════════════════════════════════════════════════════════════════════════

# Cargar configuración de Django
django_asgi_app = get_asgi_application()

# Importar el routing (lo crearemos en el siguiente paso)
from config import routing  # ← Necesita existir

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                routing.websocket_urlpatterns  # ← Definiremos esto en routing.py
            )
        )
    ),
})


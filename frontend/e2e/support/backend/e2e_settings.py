"""Configuración exclusiva del Compose E2E; nunca cargarla en un deploy."""
import os

if os.environ.get("E2E_ISOLATED") != "juniorbridge_e2e":
    raise RuntimeError("Se requiere el Compose E2E aislado")

# Estos valores deben existir ANTES de que settings.py intente cargar .env.
required = {
    "POSTGRES_HOST": "postgres",
    "POSTGRES_DB": "juniorbridge_e2e",
    "MONGODB_URI": "mongodb://mongodb:27017/",
    "MONGODB_DATABASE": "juniorbridge_e2e",
    "REDIS_URL": "redis://redis:6379/0",
}
if any(os.environ.get(key) != value for key, value in required.items()):
    raise RuntimeError("Las bases deben ser las internas del Compose E2E")

from config.settings import *  # noqa: E402,F403

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
MEDIA_ROOT = "/tmp/juniorbridge_e2e_media"

# develop fija cookies/CSRF para HTTPS interdominio. Este stack usa HTTP loopback.
AUTH_COOKIE_SECURE = False
AUTH_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = [os.environ["FRONTEND_URL"]]

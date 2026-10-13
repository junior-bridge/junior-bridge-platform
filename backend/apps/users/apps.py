from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        # Register the drf-spectacular extension for CookieJWTAuthentication.
        from . import schema  # noqa: F401

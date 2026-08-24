import os

from django.core.management.base import BaseCommand, CommandError

from allauth.socialaccount.models import SocialApp


class Command(BaseCommand):
    help = "Create or update the Google SocialApp."

    def handle(self, *args, **options):
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")

        if not client_id:
            raise CommandError("GOOGLE_CLIENT_ID no está configurado.")

        if not client_secret:
            raise CommandError("GOOGLE_CLIENT_SECRET no está configurado.")

        app, created = SocialApp.objects.update_or_create(
            provider="google",
            defaults={
                "name": "Google",
                "client_id": client_id,
                "secret": client_secret,
            },
        )

        action = "creado" if created else "actualizado"

        self.stdout.write(
            self.style.SUCCESS(
                f"SocialApp de Google {action} correctamente."
            )
        )
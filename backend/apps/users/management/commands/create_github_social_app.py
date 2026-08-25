import os

from django.core.management.base import BaseCommand, CommandError
from allauth.socialaccount.models import SocialApp


class Command(BaseCommand):
    help = "Create or update the GitHub SocialApp."

    def handle(self, *args, **options):
        client_id = os.environ.get("GITHUB_CLIENT_ID")
        client_secret = os.environ.get("GITHUB_CLIENT_SECRET")

        if not client_id:
            raise CommandError(
                "GITHUB_CLIENT_ID no está configurado."
            )

        if not client_secret:
            raise CommandError(
                "GITHUB_CLIENT_SECRET no está configurado."
            )

        app, created = SocialApp.objects.update_or_create(
            provider="github",
            defaults={
                "name": "GitHub",
                "client_id": client_id,
                "secret": client_secret,
            },
        )

        action = "creado" if created else "actualizado"

        self.stdout.write(
            self.style.SUCCESS(
                f"SocialApp de GitHub {action} correctamente."
            )
        )
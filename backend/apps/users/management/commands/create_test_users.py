import os

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import User

# Each entry: (role, email env var, default email, password env var,
# default password, surname). Defaults are for local testing only.
TEST_USERS = (
    (
        User.Role.CLIENT,
        "TEST_CLIENT_EMAIL",
        "client@juniorbridge.test",
        "TEST_CLIENT_PASSWORD",
        "Client123!",
        "Client",
    ),
    (
        User.Role.TESTER,
        "TEST_TESTER_EMAIL",
        "tester@juniorbridge.test",
        "TEST_TESTER_PASSWORD",
        "Tester123!",
        "Tester",
    ),
)

ENABLED_VALUES = {"1", "true", "yes", "on"}


class Command(BaseCommand):
    help = (
        "Create the CLIENT and TESTER test accounts if they do not exist. "
        "Runs only when SEED_TEST_USERS is enabled."
    )

    def handle(self, *args, **options):
        # Exit cleanly when disabled so it never breaks the startup chain.
        if os.environ.get("SEED_TEST_USERS", "").lower() not in ENABLED_VALUES:
            self.stdout.write(
                "SEED_TEST_USERS desactivado: no se crean usuarios de prueba."
            )
            return

        with transaction.atomic():
            for (
                role,
                email_var,
                default_email,
                password_var,
                default_password,
                surname,
            ) in TEST_USERS:
                email = os.environ.get(email_var) or default_email

                if User.objects.filter(email=email).exists():
                    self.stdout.write(f"Usuario {role} {email} ya existe.")
                    continue

                password = os.environ.get(password_var) or default_password
                User.objects.create_user(
                    email=email,
                    password=password,
                    role=role,
                    name="Test",
                    surname=surname,
                    is_active=True,
                )
                self.stdout.write(
                    self.style.SUCCESS(f"Usuario {role} {email} creado.")
                )

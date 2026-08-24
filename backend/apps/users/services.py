from django.conf import settings
from django.shortcuts import redirect

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


# JWT / session management

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def set_auth_cookies(response, tokens):
    response.set_cookie(
        key="access_token",
        value=tokens["access"],
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=900,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh"],
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=604800,
        path="/api/auth/token/refresh/",
    )

    return response


def clear_auth_cookies(response):
    response.delete_cookie(
        "access_token",
        path="/",
    )

    response.delete_cookie(
        "refresh_token",
        path="/api/auth/token/refresh/",
    )

    return response


def create_auth_response(user, data, status_code):
    tokens = get_tokens_for_user(user)

    response = Response(
        data,
        status=status_code,
    )

    return set_auth_cookies(response, tokens)


def create_auth_redirect_response(user, redirect_url):
    tokens = get_tokens_for_user(user)

    response = redirect(redirect_url)

    return set_auth_cookies(response, tokens)


# OAuth / JuniorBridge business rules

OAUTH_FLOWS = {
    "tester": User.Role.TESTER,
    "entrepreneur": User.Role.CLIENT,
}

OAUTH_PROVIDERS = {
    "google",
    "github",
}

OAUTH_PROCESSES = {
    "signup",
    "login",
}


def validate_oauth_flow(flow):
    if flow not in OAUTH_FLOWS:
        raise ValidationError("Flujo OAuth inválido.")

    return flow


def validate_oauth_process(process):
    if process not in OAUTH_PROCESSES:
        raise ValidationError("Proceso OAuth inválido.")

    return process


def get_role_from_oauth_flow(flow):
    validate_oauth_flow(flow)

    return OAUTH_FLOWS[flow]


def validate_oauth_context(request, provider):
    if provider not in OAUTH_PROVIDERS:
        raise ValidationError(
            "Proveedor OAuth no permitido."
        )

    flow = request.session.get("oauth_flow")

    validate_oauth_flow(flow)

    return flow


def apply_social_role(user, flow):
    user.role = get_role_from_oauth_flow(flow)

    return user
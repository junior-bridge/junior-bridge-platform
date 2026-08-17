from django.conf import settings

from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken


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


def create_auth_response(user, data, status_code=200):

    tokens = get_tokens_for_user(user)

    response = Response(
        data,
        status=status_code,
    )

    return set_auth_cookies(response, tokens)
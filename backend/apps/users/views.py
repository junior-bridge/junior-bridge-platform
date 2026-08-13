from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


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


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {"detail": "CSRF cookie establecida."},
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        tokens = get_tokens_for_user(user)

        response = Response(
            {
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

        return set_auth_cookies(response, tokens)


class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        response = Response(
            {
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

        return set_auth_cookies(response, tokens)


class CookieTokenRefreshView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token no encontrado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
            data={"refresh": refresh_token}
        )

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response(
                {"detail": "Refresh token inválido o expirado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = {
            "access": serializer.validated_data["access"],
        }

        if "refresh" in serializer.validated_data:
            tokens["refresh"] = serializer.validated_data["refresh"]
        else:
            tokens["refresh"] = refresh_token

        response = Response(
            {"detail": "Token renovado correctamente."},
            status=status.HTTP_200_OK,
        )

        return set_auth_cookies(response, tokens)


class LogoutView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                # Si el token ya expiró o es inválido,
                # igual eliminamos las cookies.
                pass

        response = Response(
            {"detail": "Sesión cerrada correctamente."},
            status=status.HTTP_200_OK,
        )

        return clear_auth_cookies(response)


class ProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
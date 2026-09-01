from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .services import (
    clear_auth_cookies,
    create_auth_redirect_response,
    create_auth_response,
    set_auth_cookies,
    validate_oauth_flow,
    validate_oauth_process,
)

@extend_schema(tags=['Authentication / Token'])
@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]
    @extend_schema(
        summary="Get Token CSRF",
        description="Stablishes the CSRF cookie required for protected requests.",
        responses={
            200: OpenApiResponse(
                description="Cookie CSRF stablish correctly."
            ),
        },
    )
    def get(self, request):
        return Response(
            {"detail": "CSRF cookie establecida."},
            status=status.HTTP_200_OK,
        )


class SocialOAuthStartView(APIView):
    permission_classes = [AllowAny]

    ALLOWED_PROVIDERS = {"google", "github"}

    def post(self, request, provider):
        if provider not in self.ALLOWED_PROVIDERS:
            return Response(
                {"detail": "Proveedor OAuth inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        process = request.data.get("process")
        flow = request.data.get("flow")

        try:
            validate_oauth_process(process)
        except ValidationError:
            return Response(
                {"detail": "Proceso OAuth inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if process == "signup":
            try:
                validate_oauth_flow(flow)
            except ValidationError:
                return Response(
                    {"detail": "Flujo OAuth inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            request.session["oauth_flow"] = flow
        else:
            request.session.pop("oauth_flow", None)

        request.session["oauth_process"] = process
        request.session.save()

        finalize_url = reverse("oauth-finalize")

        login_url = (
            f"/accounts/{provider}/login/"
            + "?"
            + urlencode({"next": finalize_url})
        )

        return Response(
            {
                "login_url": login_url,
            },
            status=status.HTTP_200_OK,
        )


class OAuthFinalizeView(View):

    def get(self, request):
        if not request.user.is_authenticated:
            return redirect(
                settings.FRONTEND_OAUTH_ERROR_URL
            )

        response = create_auth_redirect_response(
            request.user,
            settings.FRONTEND_OAUTH_SUCCESS_URL,
        )

        request.session.pop("oauth_process", None)
        request.session.pop("oauth_flow", None)
        request.session.save()

        return response
    

class RegisterView(APIView):

    permission_classes = [AllowAny]

    @extend_schema(
        summary="User Register",
        description="Create a new user account and automatically log in.",
        request=RegisterSerializer,
        responses={
            201:UserSerializer,
            400: OpenApiResponse(
                description="Invalid Data"
            ),
        },
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return create_auth_response(
            user,
            data={
                "user": UserSerializer(user).data,
            },
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Login",
        description="Authenticates the user and sets the authentication cookies.",
        request=LoginSerializer,
        responses={
            200:UserSerializer,
            400: OpenApiResponse(
                description="Invalid Data o Credentials"
            ),
        },
    )
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        return create_auth_response(
            user,
            data={
                "user": UserSerializer(user).data,
            },
            status_code=status.HTTP_200_OK,
        )


class CookieTokenRefreshView(APIView):

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Renew access token",
        description=(
            "Renew access token using the refresh token stored in the HttpOnly cookie."
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                description="Token renewed successfully."
            ),
            401: OpenApiResponse(
                description="Refresh token invalid ,expiered or inexistent."
            ),
        },
    )
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


@extend_schema(tags=['Authentication'])
class LogoutView(APIView):

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Logout",
        description=" Logout the user and clear the authentication cookies.",
        request=None,
        responses={
            200: OpenApiResponse(
                description="Logout Successfully."
            ),
        },
    )
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response(
            {"detail": "Sesión cerrada correctamente."},
            status=status.HTTP_200_OK,
        )

        return clear_auth_cookies(response)


@extend_schema(tags=['Authentication / Profile'])
class ProfileView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get profile",
        request=None,
        description="Get the user data authenticated.",
        responses={
            200: UserSerializer,
            401: OpenApiResponse(
                description="User is not authenticated"
            ),
        },
    )
    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    
    @extend_schema(
        summary="Update profile",
        description="Update partially the data of the authenticated user.",
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiResponse(
                description="Invalid Data"
            ),
            401: OpenApiResponse(
                description="User is not authenticated"
            ),
        },
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
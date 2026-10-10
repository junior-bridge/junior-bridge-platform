import logging
from urllib.parse import urlencode

from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Count
from rest_framework import status, generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.permissions import IsAdmin
from .models import User

from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import (
    AdminUserSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .services import (
    clear_auth_cookies,
    create_auth_redirect_response,
    create_auth_response,
    set_auth_cookies,
    validate_oauth_flow,
    validate_oauth_process,
)


logger = logging.getLogger(__name__)


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


@extend_schema(tags=['Authentication / Password Reset'])
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Request password reset",
        request=PasswordResetRequestSerializer,
        responses={
            200: OpenApiResponse(
                description="Password reset request processed."
            ),
            400: OpenApiResponse(description="Invalid email format."),
        },
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user and user.is_active and user.has_usable_password():
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{settings.FRONTEND_PASSWORD_RESET_URL}/{uid}/{token}"
            )

            try:
                send_mail(
                    subject="Recuperación de contraseña - JuniorBridge",
                    message=(
                        f"Hola {user.name},\n\n"
                        "Recibimos una solicitud para restablecer tu "
                        "contraseña.\n\n"
                        f"Abrí el siguiente enlace: {reset_url}\n\n"
                        "El enlace vence en una hora. Si no realizaste "
                        "esta solicitud, podés ignorar este mensaje."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception(
                    "No se pudo enviar el email de recuperación."
                )

        return Response(
            {
                "detail": (
                    "Si existe una cuenta asociada a ese correo, "
                    "recibirás un enlace para restablecer tu contraseña."
                )
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Authentication / Password Reset'])
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Confirm password reset",
        request=PasswordResetConfirmSerializer,
        responses={
            200: OpenApiResponse(description="Password changed."),
            400: OpenApiResponse(
                description="Invalid token or password."
            ),
        },
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
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
@extend_schema(tags=['Users'])
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.annotate(
        projects_count=Count('projects_created')
    ).order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    @extend_schema(
        summary="List users",
        description="Returns all registered users. Only administrators can access this endpoint.",
        responses={
            200: AdminUserSerializer(many=True),
            403: OpenApiResponse(
                description="Only administrators can list users."
            ),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

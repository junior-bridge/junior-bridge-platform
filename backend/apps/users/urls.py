from django.urls import path

from .views import (
    CookieTokenRefreshView,
    CsrfTokenView,
    SocialOAuthStartView,
    LoginView,
    LogoutView,
    OAuthFinalizeView,
    ProfileView,
    RegisterView,
)


urlpatterns = [
    path("csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", CookieTokenRefreshView.as_view(),name="token-refresh",),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("oauth/<str:provider>/start/", SocialOAuthStartView.as_view(), name="social-oauth-start"),
    path("oauth/finalize/", OAuthFinalizeView.as_view(), name="oauth-finalize"),
]
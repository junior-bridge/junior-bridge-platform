from django.urls import path

from .views import (
    CookieTokenRefreshView,
    CsrfTokenView,
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
)


urlpatterns = [
    path("csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path(
        "token/refresh/",
        CookieTokenRefreshView.as_view(),
        name="token-refresh",
    ),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
]
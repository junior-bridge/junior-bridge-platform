from django.urls import path

from .views import AdminUserListView


urlpatterns = [
    path("", AdminUserListView.as_view(), name="admin-user-list"),
]
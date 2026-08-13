from rest_framework.permissions import BasePermission

from .models import User


class RolePermission(BasePermission):
    """Base permission for endpoints restricted by application role."""

    recognized_roles = frozenset(User.Role.values)
    allowed_roles = frozenset()

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if user is None or not getattr(user, "is_authenticated", False):
            return False

        role = getattr(user, "role", None)
        if role not in self.recognized_roles:
            return False

        return role == User.Role.ADMIN or role in self.allowed_roles


class IsTester(RolePermission):
    allowed_roles = frozenset({User.Role.TESTER})


class IsClient(RolePermission):
    allowed_roles = frozenset({User.Role.CLIENT})


class IsAdmin(RolePermission):
    allowed_roles = frozenset({User.Role.ADMIN})

from apps.users.models import User
from apps.users.permissions import IsClient


class IsProjectOwner(IsClient):
    """Allow the owning client or an application administrator."""

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False

        user = request.user
        if user.role == User.Role.ADMIN:
            return True

        user_pk = getattr(user, "pk", None)
        return (
            user_pk is not None
            and getattr(obj, "client_id", None) == user_pk
        )

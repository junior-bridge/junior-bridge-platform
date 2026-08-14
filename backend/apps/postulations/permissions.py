from apps.users.models import User
from apps.users.permissions import IsClient, IsTester

from .models import Postulation


class IsPostulationTester(IsTester):
    """Allow the postulation's tester or an application administrator."""

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False

        user = request.user
        if user.role == User.Role.ADMIN:
            return True

        user_pk = getattr(user, "pk", None)
        return (
            user_pk is not None
            and getattr(obj, "id_tester_id", None) == user_pk
        )


class IsPostulationProjectOwner(IsClient):
    """Allow the associated project's client or an application administrator."""

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False

        user = request.user
        if user.role == User.Role.ADMIN:
            return True

        user_pk = getattr(user, "pk", None)
        project = getattr(obj, "id_project", None)
        return (
            user_pk is not None
            and getattr(project, "client_id", None) == user_pk
        )


class IsAcceptedPostulationTester(IsTester):
    """Allow the assigned tester when the postulation has been accepted."""

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False

        user = request.user
        if user.role == User.Role.ADMIN:
            return True

        user_pk = getattr(user, "pk", None)
        return (
            user_pk is not None
            and getattr(obj, "id_tester_id", None) == user_pk
            and getattr(obj, "status", None) == Postulation.State.ACCEPTED
        )

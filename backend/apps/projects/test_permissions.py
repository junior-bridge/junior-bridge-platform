from types import SimpleNamespace

from django.test import SimpleTestCase

from apps.users.models import User

from .permissions import IsProjectOwner


class IsProjectOwnerTests(SimpleTestCase):
    @staticmethod
    def user(role=None, pk=None, is_authenticated=True):
        return SimpleNamespace(
            role=role,
            pk=pk,
            is_authenticated=is_authenticated,
        )

    @staticmethod
    def project(client_id):
        return SimpleNamespace(client_id=client_id)

    def has_permission(self, user, project):
        request = SimpleNamespace(user=user)
        return IsProjectOwner().has_object_permission(request, None, project)

    def test_owner_client_is_allowed(self):
        user = self.user(User.Role.CLIENT, pk=1)

        self.assertTrue(self.has_permission(user, self.project(client_id=1)))

    def test_other_client_is_denied(self):
        user = self.user(User.Role.CLIENT, pk=2)

        self.assertFalse(self.has_permission(user, self.project(client_id=1)))

    def test_tester_is_denied(self):
        user = self.user(User.Role.TESTER, pk=1)

        self.assertFalse(self.has_permission(user, self.project(client_id=1)))

    def test_admin_is_allowed(self):
        user = self.user(User.Role.ADMIN, pk=2)

        self.assertTrue(self.has_permission(user, self.project(client_id=1)))

    def test_anonymous_user_is_denied(self):
        user = self.user(is_authenticated=False)

        self.assertFalse(self.has_permission(user, self.project(client_id=1)))

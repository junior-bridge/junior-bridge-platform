from types import SimpleNamespace

from django.test import SimpleTestCase

from apps.users.models import User

from .models import Postulation
from .permissions import (
    IsAcceptedPostulationTester,
    IsPostulationProjectOwner,
    IsPostulationTester,
)


class PostulationPermissionTestCase(SimpleTestCase):
    permission_class = None

    @staticmethod
    def user(role=None, pk=None, is_authenticated=True):
        return SimpleNamespace(
            role=role,
            pk=pk,
            is_authenticated=is_authenticated,
        )

    @staticmethod
    def postulation(tester_id=1, client_id=1, status=Postulation.State.PENDING):
        return SimpleNamespace(
            id_tester_id=tester_id,
            id_project=SimpleNamespace(client_id=client_id),
            status=status,
        )

    def has_permission(self, user, postulation=None):
        request = SimpleNamespace(user=user)
        postulation = postulation or self.postulation()
        return self.permission_class().has_object_permission(
            request,
            None,
            postulation,
        )


class IsPostulationTesterTests(PostulationPermissionTestCase):
    permission_class = IsPostulationTester

    def test_owner_tester_is_allowed(self):
        user = self.user(User.Role.TESTER, pk=1)

        self.assertTrue(self.has_permission(user))

    def test_other_tester_is_denied(self):
        user = self.user(User.Role.TESTER, pk=2)

        self.assertFalse(self.has_permission(user))

    def test_client_is_denied(self):
        user = self.user(User.Role.CLIENT, pk=1)

        self.assertFalse(self.has_permission(user))

    def test_admin_is_allowed(self):
        user = self.user(User.Role.ADMIN, pk=2)

        self.assertTrue(self.has_permission(user))

    def test_anonymous_user_is_denied(self):
        user = self.user(is_authenticated=False)

        self.assertFalse(self.has_permission(user))


class IsPostulationProjectOwnerTests(PostulationPermissionTestCase):
    permission_class = IsPostulationProjectOwner

    def test_project_owner_client_is_allowed(self):
        user = self.user(User.Role.CLIENT, pk=1)

        self.assertTrue(self.has_permission(user))

    def test_other_client_is_denied(self):
        user = self.user(User.Role.CLIENT, pk=2)

        self.assertFalse(self.has_permission(user))

    def test_tester_is_denied(self):
        user = self.user(User.Role.TESTER, pk=1)

        self.assertFalse(self.has_permission(user))

    def test_admin_is_allowed(self):
        user = self.user(User.Role.ADMIN, pk=2)

        self.assertTrue(self.has_permission(user))

    def test_anonymous_user_is_denied(self):
        user = self.user(is_authenticated=False)

        self.assertFalse(self.has_permission(user))


class IsAcceptedPostulationTesterTests(PostulationPermissionTestCase):
    permission_class = IsAcceptedPostulationTester

    def test_accepted_owner_tester_is_allowed(self):
        user = self.user(User.Role.TESTER, pk=1)
        postulation = self.postulation(status=Postulation.State.ACCEPTED)

        self.assertTrue(self.has_permission(user, postulation))

    def test_pending_owner_tester_is_denied(self):
        user = self.user(User.Role.TESTER, pk=1)
        postulation = self.postulation(status=Postulation.State.PENDING)

        self.assertFalse(self.has_permission(user, postulation))

    def test_rejected_owner_tester_is_denied(self):
        user = self.user(User.Role.TESTER, pk=1)
        postulation = self.postulation(status=Postulation.State.REJECTED)

        self.assertFalse(self.has_permission(user, postulation))

    def test_other_tester_is_denied(self):
        user = self.user(User.Role.TESTER, pk=2)
        postulation = self.postulation(status=Postulation.State.ACCEPTED)

        self.assertFalse(self.has_permission(user, postulation))

    def test_client_is_denied(self):
        user = self.user(User.Role.CLIENT, pk=1)
        postulation = self.postulation(status=Postulation.State.ACCEPTED)

        self.assertFalse(self.has_permission(user, postulation))

    def test_admin_is_allowed(self):
        user = self.user(User.Role.ADMIN, pk=2)

        self.assertTrue(self.has_permission(user))

    def test_anonymous_user_is_denied(self):
        user = self.user(is_authenticated=False)

        self.assertFalse(self.has_permission(user))

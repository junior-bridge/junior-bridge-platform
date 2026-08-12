from types import SimpleNamespace

from django.test import SimpleTestCase

from .models import User
from .permissions import IsAdmin, IsClient, IsTester


class RolePermissionTests(SimpleTestCase):
    permission_classes = (IsTester, IsClient, IsAdmin)

    @staticmethod
    def request_with_user(**user_attributes):
        return SimpleNamespace(user=SimpleNamespace(**user_attributes))

    def assert_all_permissions_denied(self, request):
        for permission_class in self.permission_classes:
            with self.subTest(permission=permission_class.__name__):
                self.assertFalse(permission_class().has_permission(request, None))

    def test_request_without_user_is_denied(self):
        self.assert_all_permissions_denied(SimpleNamespace())

    def test_anonymous_user_is_denied(self):
        request = self.request_with_user(is_authenticated=False)

        self.assert_all_permissions_denied(request)

    def test_unauthenticated_user_is_denied(self):
        request = self.request_with_user(
            is_authenticated=False,
            role=User.Role.TESTER,
        )

        self.assert_all_permissions_denied(request)

    def test_user_without_role_is_denied(self):
        request = self.request_with_user(is_authenticated=True)

        self.assert_all_permissions_denied(request)

    def test_none_role_is_denied(self):
        request = self.request_with_user(is_authenticated=True, role=None)

        self.assert_all_permissions_denied(request)

    def test_empty_role_is_denied(self):
        request = self.request_with_user(is_authenticated=True, role="")

        self.assert_all_permissions_denied(request)

    def test_tester_permissions(self):
        request = self.request_with_user(
            is_authenticated=True,
            role=User.Role.TESTER,
        )

        self.assertTrue(IsTester().has_permission(request, None))
        self.assertFalse(IsClient().has_permission(request, None))
        self.assertFalse(IsAdmin().has_permission(request, None))

    def test_client_permissions(self):
        request = self.request_with_user(
            is_authenticated=True,
            role=User.Role.CLIENT,
        )

        self.assertFalse(IsTester().has_permission(request, None))
        self.assertTrue(IsClient().has_permission(request, None))
        self.assertFalse(IsAdmin().has_permission(request, None))

    def test_admin_permissions(self):
        request = self.request_with_user(
            is_authenticated=True,
            role=User.Role.ADMIN,
        )

        self.assertTrue(IsTester().has_permission(request, None))
        self.assertTrue(IsClient().has_permission(request, None))
        self.assertTrue(IsAdmin().has_permission(request, None))

    def test_unknown_role_is_denied(self):
        request = self.request_with_user(is_authenticated=True, role="UNKNOWN")

        self.assert_all_permissions_denied(request)

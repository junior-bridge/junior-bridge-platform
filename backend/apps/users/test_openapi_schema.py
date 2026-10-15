from django.test import SimpleTestCase
from drf_spectacular.generators import SchemaGenerator


class OpenApiSchemaTests(SimpleTestCase):
    """The generated OpenAPI schema documents every endpoint and the cookie auth."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.schema = SchemaGenerator().get_schema(request=None, public=True)

    def get_operation(self, path, method):
        paths = self.schema["paths"]
        self.assertIn(path, paths, f"{path} is missing from the schema")
        self.assertIn(
            method,
            paths[path],
            f"{method.upper()} {path} is missing from the schema",
        )
        return paths[path][method]

    def test_previously_undocumented_endpoints_describe_their_responses(self):
        # Arrange
        # Act
        # (path, method, success status) for views drf-spectacular could not
        # introspect: each must expose a JSON body schema and a summary.
        expected = [
            ("/api/admin/stats/", "get", "200"),
            ("/api/projects/{id_project}/postulations/", "get", "200"),
            ("/api/projects/{id_project}/postulations/", "post", "201"),
            ("/api/postulations/{id_postulation}/", "get", "200"),
            ("/api/postulations/{id_postulation}/accept/", "post", "200"),
            ("/api/postulations/{id_postulation}/reject/", "post", "200"),
            ("/api/projects/{id}/finish-delivery/", "post", "200"),
            ("/api/projects/{id}/complete/", "post", "200"),
            ("/api/auth/oauth/{provider}/start/", "post", "200"),
        ]
        for path, method, code in expected:
            with self.subTest(path=path, method=method):
                operation = self.get_operation(path, method)
        # Assert
                self.assertTrue(operation.get("summary"), "missing summary")
                self.assertIn(code, operation["responses"])
                self.assertIn(
                    "application/json",
                    operation["responses"][code].get("content", {}),
                    f"{method.upper()} {path} {code} has no response body",
                )

    def test_postulation_withdraw_documents_no_content(self):
        # Arrange
        # Act
        operation = self.get_operation("/api/postulations/{id_postulation}/", "delete")
        # Assert
        self.assertTrue(operation.get("summary"), "missing summary")
        self.assertIn("204", operation["responses"])

    def test_oauth_start_documents_request_body(self):
        # Arrange
        # Act
        operation = self.get_operation("/api/auth/oauth/{provider}/start/", "post")
        # Assert
        self.assertIn("requestBody", operation)

    def test_cookie_jwt_security_scheme_is_registered(self):
        # Arrange
        # Act
        schemes = self.schema.get("components", {}).get("securitySchemes", {})
        # Assert
        self.assertIn("cookieJWTAuth", schemes)
        self.assertEqual(schemes["cookieJWTAuth"]["type"], "apiKey")
        self.assertEqual(schemes["cookieJWTAuth"]["in"], "cookie")
        self.assertEqual(schemes["cookieJWTAuth"]["name"], "access_token")

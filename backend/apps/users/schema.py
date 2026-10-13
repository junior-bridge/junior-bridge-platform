from drf_spectacular.extensions import OpenApiAuthenticationExtension


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Documents CookieJWTAuthentication as an apiKey sent in the access cookie."""

    target_class = "apps.users.authentication.CookieJWTAuthentication"
    name = "cookieJWTAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            # Must match the cookie read in CookieJWTAuthentication.authenticate().
            "name": "access_token",
            "description": (
                "JWT access token stored in an HttpOnly cookie. It is set by "
                "the login, register, OAuth and token refresh endpoints."
            ),
        }

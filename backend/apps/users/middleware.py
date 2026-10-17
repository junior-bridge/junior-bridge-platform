from django.conf import settings


class ProxyHostMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.DEBUG and request.path.startswith("/accounts/"):
            request.META["HTTP_HOST"] = settings.PUBLIC_HOST
            request.META["HTTP_X_FORWARDED_HOST"] = settings.PUBLIC_HOST
        return self.get_response(request)

"""Client for the Google PageSpeed Insights API .
"""
import http.client
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

from .models import Project, ProjectAudit

logger = logging.getLogger(__name__)

PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

CATEGORY_FIELDS = {
    "performance": "performance",
    "accessibility": "accessibility",
    "best-practices": "best_practices",
    "seo": "seo",
}

REQUESTED_CATEGORIES = ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]


class PageSpeedError(Exception):
    """Raised when PageSpeed Insights cannot produce a usable result."""


def build_request_url(url: str, strategy: str) -> str:
    params = {
        "url": url,
        "strategy": strategy.lower(),
        "category": REQUESTED_CATEGORIES,
    }
    if settings.PAGESPEED_API_KEY:
        params["key"] = settings.PAGESPEED_API_KEY
    return f"{PAGESPEED_ENDPOINT}?{urllib.parse.urlencode(params, doseq=True)}"


def _to_percentage(score) -> int | None:
    """Convert a Lighthouse score (0-1 or null) to an integer from 0 to 100."""
    if score is None:
        return None
    is_number = isinstance(score, (int, float)) and not isinstance(score, bool)
    if not is_number or not 0 <= score <= 1:
        raise PageSpeedError(
            "PageSpeed Insights devolvió una puntuación con formato inválido."
        )
    return round(score * 100)


def _extract_scores(lighthouse: dict) -> dict[str, int | None]:
    categories = lighthouse.get("categories")
    if categories is None:
        categories = {}
    if not isinstance(categories, dict):
        raise PageSpeedError(
            "PageSpeed Insights devolvió categorías con formato inválido."
        )

    scores = {}
    for category, field in CATEGORY_FIELDS.items():
        data = categories.get(category)
        if data is None:
            scores[field] = None
            continue
        if not isinstance(data, dict):
            raise PageSpeedError(
                "PageSpeed Insights devolvió categorías con formato inválido."
            )
        scores[field] = _to_percentage(data.get("score"))
    return scores


def fetch_pagespeed_scores(url: str, strategy: str) -> dict[str, int | None]:
    """Run a PSI audit and return the category scores normalized to 0-100."""
    request_url = build_request_url(url, strategy)

    try:
        with urllib.request.urlopen(
            request_url, timeout=settings.PAGESPEED_TIMEOUT
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise PageSpeedError(
            f"PageSpeed Insights respondió con estado HTTP {exc.code}."
        ) from exc
    except (OSError, http.client.HTTPException) as exc:
        raise PageSpeedError(
            "No se pudo conectar con PageSpeed Insights o se agotó el tiempo de espera."
        ) from exc
    except ValueError as exc:
        raise PageSpeedError(
            "PageSpeed Insights devolvió una respuesta inválida."
        ) from exc

    lighthouse = payload.get("lighthouseResult") if isinstance(payload, dict) else None
    if not isinstance(lighthouse, dict):
        raise PageSpeedError(
            "La respuesta de PageSpeed Insights no contiene resultados de Lighthouse."
        )

    return _extract_scores(lighthouse)


def run_project_audit(
    project: Project,
    requested_by,
    strategy: str = ProjectAudit.Strategy.MOBILE,
) -> ProjectAudit:
    """Audit the project's demo URL and always persist the outcome."""
    try:
        scores = fetch_pagespeed_scores(project.demo_url, strategy)
    except PageSpeedError as exc:
        logger.warning(
            "PageSpeed audit failed for project %s: %s", project.pk, exc
        )
        return ProjectAudit.objects.create(
            project=project,
            requested_by=requested_by,
            strategy=strategy,
            status=ProjectAudit.Status.FAILED,
            error_message=str(exc),
        )

    return ProjectAudit.objects.create(
        project=project,
        requested_by=requested_by,
        strategy=strategy,
        status=ProjectAudit.Status.SUCCESS,
        **scores,
    )

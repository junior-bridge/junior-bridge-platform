import os


def positive_int_env(name, default):
    """Read a positive integer from the environment, falling back to default.

    Empty, non-numeric, zero or negative values return the default so a
    misconfigured .env never breaks startup or disables a safety limit.
    """
    raw = os.getenv(name, "").strip()

    try:
        value = int(raw)
    except ValueError:
        return default

    return value if value > 0 else default


def bool_env(name, default=False):
    """Read a boolean from the environment."""
    raw = os.getenv(name, "").strip().lower()

    if raw in {"1", "true", "yes", "on"}:
        return True
    if raw in {"0", "false", "no", "off"}:
        return False

    return default


def http_protocol_env(name, default="https"):
    """Read "http" or "https" from the environment.

    Any other value returns the default, so production keeps https unless a
    local .env explicitly opts into http.
    """
    raw = os.getenv(name, "").strip().lower()

    return raw if raw in {"http", "https"} else default


def csv_env(name, default):
    """Read a comma-separated list from the environment."""
    raw = os.getenv(name, "").strip()

    if not raw:
        return list(default)

    return [value.strip() for value in raw.split(",") if value.strip()]

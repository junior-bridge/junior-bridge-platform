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


def csv_env(name, default):
    """Read a comma-separated list from the environment."""
    raw = os.getenv(name, "").strip()

    if not raw:
        return list(default)

    return [value.strip() for value in raw.split(",") if value.strip()]

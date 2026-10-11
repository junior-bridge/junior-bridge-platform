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

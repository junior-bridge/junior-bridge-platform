"""Short-lived signed tickets for authenticating the notifications WebSocket.

The WebSocket connects directly to the API origin, where the JWT cookie is a
third-party cookie that some browsers block. The frontend fetches a ticket
through the same-origin proxy and passes it as a query parameter instead.
Tickets are time-limited but not single-use.
"""
from django.core import signing

WS_TICKET_SALT = 'notifications.ws-ticket'
WS_TICKET_MAX_AGE_SECONDS = 30


def issue_ticket(user):
    """Return a signed, timestamped ticket that identifies ``user``."""
    return signing.dumps(user.pk, salt=WS_TICKET_SALT)


def user_id_from_ticket(ticket):
    """Return the user id inside a valid ticket, or None. Never raises."""
    if not isinstance(ticket, str) or not ticket:
        return None

    try:
        user_id = signing.loads(
            ticket,
            salt=WS_TICKET_SALT,
            max_age=WS_TICKET_MAX_AGE_SECONDS,
        )
    except (signing.BadSignature, ValueError, TypeError):
        return None

    if isinstance(user_id, bool) or not isinstance(user_id, int):
        return None

    return user_id

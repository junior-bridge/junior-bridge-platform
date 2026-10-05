from django.db.models import Avg
from apps.users.models import User
from .models import Rating


def update_tester_reputation(tester: User) -> None:
    average = Rating.objects.filter(
        id_postulation__id_tester=tester,
        id_postulation__id_project__state="COMPLETED",
    ).aggregate(
        average=Avg("stars")
    )["average"]

    tester.reputation = round(average, 2) if average is not None else 0
    tester.save(update_fields=["reputation"])
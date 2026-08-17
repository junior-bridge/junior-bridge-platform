from rest_framework import serializers

from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = [
            "id_rating",
            "id_postulation",
            "stars",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id_rating",
            "id_postulation",
            "created_at",
            "updated_at",
        ]
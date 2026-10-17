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


class TesterRatingSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(
        source="id_postulation.id_project.title",
        read_only=True,
    )
    entrepreneur_name = serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = [
            "id_rating",
            "id_postulation",
            "stars",
            "comment",
            "created_at",
            "project_title",
            "entrepreneur_name",
        ]

    def get_entrepreneur_name(self, obj):
        client = obj.id_postulation.id_project.client
        full_name = f"{client.name} {client.surname}".strip()
        return full_name or client.email
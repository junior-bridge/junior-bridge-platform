import json

from django.urls import reverse
from rest_framework.fields import empty
from rest_framework import serializers


class StringListField(serializers.ListField):
    def get_value(self, dictionary):
        if hasattr(dictionary, "getlist"):
            return dictionary.get(self.field_name, empty)
        return super().get_value(dictionary)

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                self.fail("not_a_list")

        return super().to_internal_value(data)


class EvidenceImagesField(serializers.ListField):
    child = serializers.ImageField()

    def __init__(self, **kwargs):
        kwargs.setdefault("required", False)
        kwargs.setdefault("max_length", 5)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        files = super().to_internal_value(data)

        for file in files:
            if file.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Cada imagen debe pesar 5 MB o menos."
                )
            if file.content_type not in {
                "image/jpeg",
                "image/png",
                "image/webp",
            }:
                raise serializers.ValidationError(
                    "Solo se permiten imágenes JPG, PNG o WEBP."
                )

        return files

    def to_representation(self, data):
        report_id = str(self.parent.instance["_id"])
        return [
            reverse(
                "report-evidence",
                kwargs={"id_report": report_id, "index": index},
            )
            for index, _ in enumerate(data or [])
        ]


class ReportSerializer(serializers.Serializer):
    _id = serializers.CharField(read_only=True)
    id_postulation = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    severity = serializers.ChoiceField(
        choices=[
            "low",
            "medium",
            "high",
            "critical"
        ]
    )
    steps_to_reproduce = StringListField(
        child=serializers.CharField()
    )
    capture_evidence = serializers.URLField(
        required=False,
        allow_null=True
    )
    evidence_images = EvidenceImagesField()
    created_at = serializers.DateTimeField(read_only=True, required=False)
    state = serializers.CharField(read_only=True, required=False)
    updated_at = serializers.DateTimeField(read_only=True, required=False)
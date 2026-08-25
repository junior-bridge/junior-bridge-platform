from rest_framework import serializers


class ReportSerializer(serializers.Serializer):
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
    steps_to_reproduce = serializers.ListField(
        child=serializers.CharField()
    )
    capture_evidence = serializers.URLField(
        required=False,
        allow_null=True
    )
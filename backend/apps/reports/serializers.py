from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    id_report = serializers.IntegerField(source='id', read_only=True)
    
    steps_to_reproduce = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Report
        fields = [
            'id_report',
            'id_postulation',
            'title',
            'description',
            'risk_level',
            'steps_to_reproduce',
            'capture_evidence',
            'state',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_report', 'id_postulation', 'state', 'created_at', 'updated_at']
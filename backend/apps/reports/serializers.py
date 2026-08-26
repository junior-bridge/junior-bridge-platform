from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'id_report',
            'id_postulation',
            'title',
            'description',
            'risk_level',
            'capture_evidence',
            'state',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id_report', 'id_postulation', 'state', 'created_at', 'updated_at']
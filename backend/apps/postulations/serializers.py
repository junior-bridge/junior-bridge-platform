from rest_framework import serializers
from .models import Postulation


class PostulationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Postulation
        fields = [
            'id_postulation',
            'id_project',
            'id_tester',
            'status',
            'postulation_date',
        ]
        read_only_fields = [
            'id_postulation',
            'id_project',
            'id_tester',
            'status',
            'postulation_date',
        ]
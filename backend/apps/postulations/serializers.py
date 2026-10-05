from rest_framework import serializers
from .models import Postulation


class PostulationSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(
        source='id_project.title',
        read_only=True,
    )
    tester_name = serializers.SerializerMethodField()
    tester_email = serializers.EmailField(
        source='id_tester.email',
        read_only=True,
    )
    tester_reputation = serializers.DecimalField(
        source='id_tester.reputation',
        max_digits=3,
        decimal_places=2,
        read_only=True,
    )

    def get_tester_name(self, obj):
        return f'{obj.id_tester.name} {obj.id_tester.surname}'.strip()

    class Meta:
        model = Postulation
        fields = [
            'id_postulation',
            'id_project',
            'project_title',
            'id_tester',
            'tester_name',
            'tester_email',
            'tester_reputation',
            'status',
            'postulation_date',
        ]
        read_only_fields = [
            'id_postulation',
            'id_project',
            'project_title',
            'id_tester',
            'tester_name',
            'tester_email',
            'tester_reputation',
            'status',
            'postulation_date',
        ]

from rest_framework import serializers

from apps.users.models import User

from .models import Project


class ProjectClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'surname', 'email']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'description',
            'repository',
            'demo_url',
            'technologies',
            'modality',
            'state',
            'client',
            'created_at',
            'updated_at',
            'finalized_at',
        ]
        read_only_fields = [
            'id',
            'state',
            'client',
            'created_at',
            'updated_at',
            'finalized_at',
        ]


class AdminProjectSerializer(ProjectSerializer):
    client = ProjectClientSerializer(read_only=True)


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['state']

    def validate_state(self, value):
        allowed_states = ['OPEN', 'REJECTED']

        if value not in allowed_states:
            raise serializers.ValidationError(
                'The state must be OPEN or REJECTED.'
            )

        return value

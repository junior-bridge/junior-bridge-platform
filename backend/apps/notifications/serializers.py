from apps.users.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from apps.notifications.models import Notification


@extend_schema_field({"type": "string", "nullable": True, "readOnly": True})
class _UsernameField(serializers.ReadOnlyField):
    """Same ReadOnlyField DRF builds for User.username (set to None on the model).

    Declared explicitly only so the OpenAPI schema can describe it.
    """

 
class UserSimpleSerializer(serializers.ModelSerializer):
    username = _UsernameField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id', 'username', 'email']
 

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id_notification',
            'id_user',
            'type',
            'message',
            'is_read',
            'created_at'
        ]
        read_only_fields = ['id_notification', 'created_at']

class NotificationListSerializer(serializers.ModelSerializer):
    id_user = UserSimpleSerializer(read_only=True)  
    
    class Meta:
        model = Notification
        fields = [
            'id_notification',
            'id_user',
            'type',
            'message',
            'is_read',
            'created_at'
        ]

class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['type', 'message']
    
    def validate_type(self, value):
        valid_types = ['postulation', 'comment', 'message', 'system']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Tipo inválido. Debe ser: {', '.join(valid_types)}"
            )
        return value
    
    def validate_message(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError(
                "El mensaje no puede estar vacío"
            )
        if len(value) > 500:
            raise serializers.ValidationError(
                "El mensaje no puede exceder 500 caracteres"
            )
        return value

class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['is_read']

class NotificationWebSocketSerializer(serializers.ModelSerializer):
    
    username = serializers.CharField(source='id_user.username', read_only=True)
    class Meta:
        model = Notification
        fields = [
            'id_notification',
            'type',
            'message',
            'username',
            'created_at',
            'is_read'
        ]
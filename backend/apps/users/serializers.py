from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password]
    )

    class Meta:
        model = User

        fields = [
            "email",
            "password",
            "name",
            "surname",
            "dni",
            "phone",
            "sex",
            "date_of_birth",
            "zona",
        ]

        extra_kwargs = {
            "email": { "required": True, },

            "name": { "required": True, },

            "surname": { "required": True, },

            "zona": { "required": False, "allow_blank": False, },

            "dni": { "required": False, "allow_null": True, "allow_blank": True, },

            "phone": { "required": False, "allow_blank": True, },

            "sex": { "required": False, "allow_blank": True, },

            "date_of_birth": { "required": False, "allow_null": True, },
        }

    def validate_email(self, value):

        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario registrado con este email."
            )

        return value

    def create(self, validated_data):

        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            role=User.Role.CLIENT,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data["email"].strip().lower()

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=data["password"],
        )

        if user is None:
            raise serializers.ValidationError(
                "Credenciales inválidas."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "No se pudo completar el inicio de sesión."
            )

        data["user"] = user

        return data


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "name",
            "surname",
            "dni",
            "phone",
            "sex",
            "date_of_birth",
            "zona",
            "role",
            "reputation",
            "date_joined",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "email",
            "role",
            "reputation",
            "date_joined",
            "created_at",
            "updated_at",
        ]
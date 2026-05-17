from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile


def _bootstrap_admin_emails():
    return {
        e.strip().lower()
        for e in getattr(settings, "BOOTSTRAP_ADMIN_EMAILS", [])
        if e and str(e).strip()
    }


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    middle_name = serializers.CharField(max_length=100, allow_blank=True, default="")
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        validate_password(attrs["password"])
        if User.objects.filter(username__iexact=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        middle_name = validated_data.pop("middle_name", "")
        last_name = validated_data.pop("last_name")
        email = validated_data.pop("email")
        username = validated_data.pop("username")
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            last_name=last_name,
            first_name="",
        )
        role = UserProfile.Role.AGENT
        if email.lower() in _bootstrap_admin_emails():
            role = UserProfile.Role.ADMIN
        UserProfile.objects.create(
            django_user=user,
            middle_name=middle_name,
            email=email,
            clerk_id=None,
            role=role,
        )
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Login with email + password.

    The parent `TokenObtainPairSerializer` always adds a `username` field (see USERNAME_FIELD).
    The SPA sends `{ email, password }` only, which caused 400s. We remove `username` and require
    `email` instead.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop(self.username_field, None)
        self.fields["email"] = serializers.EmailField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = User.objects.filter(email__iexact=email).first() if email else None
        if user is None or not user.check_password(password or ""):
            raise serializers.ValidationError({"detail": "Invalid email or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Account is disabled."})
        if not hasattr(user, "crm_profile"):
            raise serializers.ValidationError(
                {"detail": "Richi CRM profile not found for this account."}
            )
        self.user = user
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

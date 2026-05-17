from django.utils import timezone
from rest_framework import serializers

from .auth_utils import user_has_admin_role, user_owner_scope_id
from .models import Lead, LeadNote, SystemLog, Task, UserProfile


def _request_user_is_admin(request):
    return user_has_admin_role(request.user)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "clerk_id",
            "email",
            "middle_name",
            "role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["clerk_id", "created_at", "updated_at"]

    def get_username(self, obj):
        if obj.django_user_id:
            return obj.django_user.username
        return ""


class UserProfileRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["role"]


class SystemLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemLog
        fields = ["id", "level", "message", "actor_clerk_id", "metadata", "created_at"]


class LeadSerializer(serializers.ModelSerializer):
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id",
            "owner_id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "company",
            "status",
            "source",
            "estimated_value",
            "last_contacted_at",
            "notes_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "last_contacted_at"]

    def get_notes_count(self, obj):
        if hasattr(obj, "notes_count"):
            return obj.notes_count
        return obj.notes.count()

    def validate(self, attrs):
        request = self.context.get("request")
        if request and _request_user_is_admin(request):
            return attrs
        attrs.pop("owner_id", None)
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and _request_user_is_admin(request):
            raw_owner = self.initial_data.get("owner_id")
            if raw_owner is not None:
                validated_data["owner_id"] = str(raw_owner).strip()
            else:
                validated_data.setdefault("owner_id", "")
        elif request and user_owner_scope_id(request.user):
            validated_data["owner_id"] = user_owner_scope_id(request.user)
        else:
            validated_data.setdefault("owner_id", "")
        new_status = validated_data.get("status", Lead.Status.NEW)
        if new_status == Lead.Status.CONTACTED:
            validated_data.setdefault("last_contacted_at", timezone.now())
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and not _request_user_is_admin(request):
            validated_data.pop("owner_id", None)
        elif request and _request_user_is_admin(request) and "owner_id" in self.initial_data:
            oid = self.initial_data.get("owner_id")
            validated_data["owner_id"] = "" if oid is None else str(oid).strip()
        new_status = validated_data.get("status", instance.status)
        if new_status == Lead.Status.CONTACTED and instance.status != Lead.Status.CONTACTED:
            validated_data.setdefault("last_contacted_at", timezone.now())
        return super().update(instance, validated_data)


class TaskSerializer(serializers.ModelSerializer):
    lead_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "lead",
            "lead_name",
            "title",
            "description",
            "due_date",
            "completed",
            "priority",
            "created_at",
        ]
        read_only_fields = ["id", "lead_name", "created_at"]

    def get_lead_name(self, obj):
        return f"{obj.lead.first_name} {obj.lead.last_name}".strip()

    def validate_lead(self, lead):
        request = self.context.get("request")
        if request and _request_user_is_admin(request):
            return lead
        oid = user_owner_scope_id(request.user)
        if request and oid:
            if lead.owner_id != oid:
                raise serializers.ValidationError("Lead not found.")
        return lead


class LeadNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadNote
        fields = ["id", "lead", "body", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_lead(self, lead):
        request = self.context.get("request")
        if request and _request_user_is_admin(request):
            return lead
        oid = user_owner_scope_id(request.user)
        if request and oid:
            if lead.owner_id != oid:
                raise serializers.ValidationError("Lead not found.")
        return lead

    def create(self, validated_data):
        request = self.context.get("request")
        oid = user_owner_scope_id(request.user) if request else None
        if request and oid:
            validated_data["owner_id"] = oid
        else:
            validated_data.setdefault("owner_id", "")
        return super().create(validated_data)

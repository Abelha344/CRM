"""
Role-based permissions for DRF. Roles are stored on UserProfile linked to Django User (JWT).
"""

from __future__ import annotations

from rest_framework import permissions

from .models import UserProfile


class IsAgentOrAdmin(permissions.BasePermission):
    """Authenticated users with role ADMIN or AGENT on their CRM profile."""

    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, "is_authenticated", False):
            return False
        profile = getattr(user, "crm_profile", None)
        if profile is None:
            return False
        return profile.role in (UserProfile.Role.ADMIN, UserProfile.Role.AGENT)


class IsAdmin(permissions.BasePermission):
    """CRM ADMIN role, or Django superuser (database / staff admin)."""

    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, "is_authenticated", False):
            return False
        if getattr(user, "is_superuser", False):
            return True
        profile = getattr(user, "crm_profile", None)
        return bool(profile and profile.role == UserProfile.Role.ADMIN)

"""Helpers for Django User + UserProfile (JWT auth)."""

from __future__ import annotations

from django.contrib.auth.models import User

from .models import UserProfile


def get_crm_profile(user) -> UserProfile | None:
    if not user.is_authenticated:
        return None
    if isinstance(user, User):
        return getattr(user, "crm_profile", None)
    return None


def user_owner_scope_id(user) -> str | None:
    """Value stored in Lead.owner_id / filters for this user."""
    p = get_crm_profile(user)
    if p is None:
        return None
    if p.clerk_id:
        return p.clerk_id
    return str(user.pk)


def user_has_admin_role(user) -> bool:
    p = get_crm_profile(user)
    return bool(p and p.role == UserProfile.Role.ADMIN)

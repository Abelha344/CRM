"""Create or link Django users from OAuth profile data and issue JWT pair."""

from __future__ import annotations

import re
import secrets

from django.conf import settings
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile


def _bootstrap_admin_emails() -> set[str]:
    return {
        e.strip().lower()
        for e in getattr(settings, "BOOTSTRAP_ADMIN_EMAILS", [])
        if e and str(e).strip()
    }


def _unique_username(base: str) -> str:
    base = re.sub(r"[^\w.@+-]", "_", base)[:140] or "user"
    if not User.objects.filter(username__iexact=base).exists():
        return base
    for _ in range(12):
        candidate = f"{base}_{secrets.token_hex(3)}"
        if not User.objects.filter(username__iexact=candidate).exists():
            return candidate
    return f"{base}_{secrets.token_hex(8)}"


def get_or_create_user_from_oauth(
    *,
    email: str,
    first_name: str = "",
    last_name: str = "",
    middle_name: str = "",
) -> User:
    email = (email or "").strip().lower()
    if not email:
        raise ValueError("OAuth profile did not return an email.")

    user = User.objects.filter(email__iexact=email).first()
    if user:
        updated = False
        if first_name and not user.first_name:
            user.first_name = first_name[:150]
            updated = True
        if last_name and not user.last_name:
            user.last_name = last_name[:150]
            updated = True
        if updated:
            user.save(update_fields=["first_name", "last_name"])
        profile = UserProfile.objects.filter(django_user=user).first()
        if profile is None:
            role = (
                UserProfile.Role.ADMIN
                if email.lower() in _bootstrap_admin_emails()
                else UserProfile.Role.AGENT
            )
            UserProfile.objects.create(
                django_user=user,
                middle_name=middle_name[:100] if middle_name else "",
                email=email,
                clerk_id=None,
                role=role,
            )
        elif middle_name and not profile.middle_name:
            profile.middle_name = middle_name[:100]
            profile.save(update_fields=["middle_name"])
        return user

    local = email.split("@")[0]
    username = _unique_username(local)
    user = User(
        username=username,
        email=email,
        first_name=(first_name or "")[:150],
        last_name=(last_name or "")[:150],
    )
    user.set_unusable_password()
    user.save()
    role = UserProfile.Role.ADMIN if email.lower() in _bootstrap_admin_emails() else UserProfile.Role.AGENT
    UserProfile.objects.create(
        django_user=user,
        middle_name=middle_name[:100] if middle_name else "",
        email=email,
        clerk_id=None,
        role=role,
    )
    return user


def issue_tokens_for_user(user: User) -> tuple[str, str]:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)

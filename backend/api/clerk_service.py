"""Link Clerk `sub` to Django User + UserProfile for JWT API access."""

from __future__ import annotations

import re
import secrets

from django.conf import settings
from django.contrib.auth.models import User

from .models import UserProfile


def _bootstrap_admin_clerk_ids() -> set[str]:
    return {x.strip() for x in getattr(settings, "BOOTSTRAP_ADMIN_CLERK_IDS", []) if x.strip()}


def _unique_username(base: str) -> str:
    base = re.sub(r"[^\w.@+-]", "_", base)[:140] or "user"
    if not User.objects.filter(username__iexact=base).exists():
        return base
    for _ in range(12):
        candidate = f"{base}_{secrets.token_hex(3)}"
        if not User.objects.filter(username__iexact=candidate).exists():
            return candidate
    return f"{base}_{secrets.token_hex(8)}"


def upsert_user_from_clerk_claims(claims: dict) -> User:
    sub = (claims.get("sub") or "").strip()
    if not sub:
        raise ValueError("Clerk token missing sub.")

    email = (claims.get("email") or "").strip().lower()
    first = (claims.get("given_name") or claims.get("first_name") or "")[:150]
    last = (claims.get("family_name") or claims.get("last_name") or "")[:150]

    profile = UserProfile.objects.filter(clerk_id=sub).select_related("django_user").first()
    if profile and profile.django_user_id:
        user = profile.django_user
        if email and user.email != email:
            user.email = email
            user.save(update_fields=["email"])
        if profile.email != email and email:
            profile.email = email
            profile.save(update_fields=["email"])
        return user

    if email:
        user = User.objects.filter(email__iexact=email).first()
        if user:
            profile = UserProfile.objects.filter(django_user=user).first()
            if profile is None:
                role = (
                    UserProfile.Role.ADMIN
                    if sub in _bootstrap_admin_clerk_ids()
                    else UserProfile.Role.AGENT
                )
                UserProfile.objects.create(
                    django_user=user,
                    middle_name="",
                    email=email,
                    clerk_id=sub,
                    role=role,
                )
            else:
                if not profile.clerk_id:
                    profile.clerk_id = sub
                if email:
                    profile.email = email
                profile.save(update_fields=["clerk_id", "email"])
            return user

    local = email.split("@")[0] if email else f"clerk_{sub[:12]}"
    username = _unique_username(local)
    placeholder_email = email or f"{sub}@placeholder.clerk.local"
    user = User(
        username=username,
        email=placeholder_email,
        first_name=first,
        last_name=last,
    )
    user.set_unusable_password()
    user.save()

    role = UserProfile.Role.ADMIN if sub in _bootstrap_admin_clerk_ids() else UserProfile.Role.AGENT
    UserProfile.objects.create(
        django_user=user,
        middle_name="",
        email=email or placeholder_email,
        clerk_id=sub,
        role=role,
    )
    return user

"""
DRF-friendly role checks for function-based views (in addition to permission classes).
"""

from __future__ import annotations

from functools import wraps

from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request

from .models import UserProfile


def require_roles(*allowed: str):
    """Wrap an @api_view function: raises PermissionDenied unless CRM profile role matches."""

    allowed_set = frozenset(allowed)

    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request: Request, *args, **kwargs):
            user = request.user
            if not getattr(user, "is_authenticated", False):
                raise PermissionDenied("Authentication required.")
            profile = getattr(user, "crm_profile", None)
            role = profile.role if profile else None
            if role not in allowed_set:
                raise PermissionDenied("You do not have permission to perform this action.")
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator


require_admin = require_roles(UserProfile.Role.ADMIN)
require_agent_or_admin = require_roles(UserProfile.Role.ADMIN, UserProfile.Role.AGENT)

"""OAuth2 redirect flow for Google and Facebook → JWT handoff to SPA (URL fragment)."""

from __future__ import annotations

import secrets
from urllib.parse import quote, urlencode

import requests
from django.conf import settings
from django.http import HttpResponseRedirect
from django.views import View
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .oauth_service import get_or_create_user_from_oauth, issue_tokens_for_user


def _frontend_oauth_callback() -> str:
    return getattr(settings, "OAUTH_FRONTEND_CALLBACK_URL", "").strip() or "http://localhost:5173/oauth/callback"


def _redirect_success(access: str, refresh: str) -> HttpResponseRedirect:
    url = _frontend_oauth_callback()
    frag = urlencode({"access": access, "refresh": refresh})
    return HttpResponseRedirect(f"{url}#{frag}")


def _redirect_error(code: str) -> HttpResponseRedirect:
    url = _frontend_oauth_callback()
    return HttpResponseRedirect(f"{url}?error={quote(code)}")


class GoogleOAuthStartView(View):
    def get(self, request):
        cid = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "").strip()
        if not cid:
            return _redirect_error("google_not_configured")
        state = secrets.token_urlsafe(32)
        request.session["oauth_google_state"] = state
        redirect_uri = getattr(settings, "GOOGLE_OAUTH_REDIRECT_URI", "").strip()
        if not redirect_uri:
            return _redirect_error("google_redirect_missing")
        params = {
            "client_id": cid,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "include_granted_scopes": "true",
        }
        return HttpResponseRedirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))


class GoogleOAuthCallbackView(View):
    def get(self, request):
        err = request.GET.get("error")
        if err:
            return _redirect_error("google_denied")
        state = request.GET.get("state")
        if not state or state != request.session.get("oauth_google_state"):
            return _redirect_error("google_state_invalid")
        request.session.pop("oauth_google_state", None)
        code = request.GET.get("code")
        if not code:
            return _redirect_error("google_no_code")

        cid = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "").strip()
        secret = getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "").strip()
        redirect_uri = getattr(settings, "GOOGLE_OAUTH_REDIRECT_URI", "").strip()
        if not all([cid, secret, redirect_uri]):
            return _redirect_error("google_not_configured")

        token_res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": cid,
                "client_secret": secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=30,
        )
        if not token_res.ok:
            return _redirect_error("google_token_exchange")
        access_token = token_res.json().get("access_token")
        if not access_token:
            return _redirect_error("google_no_access_token")

        ui = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30,
        )
        if not ui.ok:
            return _redirect_error("google_userinfo")
        data = ui.json()
        email = data.get("email")
        given = data.get("given_name") or ""
        family = data.get("family_name") or ""
        try:
            user = get_or_create_user_from_oauth(
                email=email,
                first_name=given,
                last_name=family,
                middle_name="",
            )
        except ValueError:
            return _redirect_error("google_no_email")
        a, r = issue_tokens_for_user(user)
        return _redirect_success(a, r)


class FacebookOAuthStartView(View):
    def get(self, request):
        cid = getattr(settings, "FACEBOOK_APP_ID", "").strip()
        if not cid:
            return _redirect_error("facebook_not_configured")
        state = secrets.token_urlsafe(32)
        request.session["oauth_facebook_state"] = state
        redirect_uri = getattr(settings, "FACEBOOK_OAUTH_REDIRECT_URI", "").strip()
        if not redirect_uri:
            return _redirect_error("facebook_redirect_missing")
        params = {
            "client_id": cid,
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": "email,public_profile",
        }
        return HttpResponseRedirect(
            "https://www.facebook.com/v18.0/dialog/oauth?" + urlencode(params)
        )


class FacebookOAuthCallbackView(View):
    def get(self, request):
        err = request.GET.get("error")
        if err:
            return _redirect_error("facebook_denied")
        state = request.GET.get("state")
        if not state or state != request.session.get("oauth_facebook_state"):
            return _redirect_error("facebook_state_invalid")
        request.session.pop("oauth_facebook_state", None)
        code = request.GET.get("code")
        if not code:
            return _redirect_error("facebook_no_code")

        app_id = getattr(settings, "FACEBOOK_APP_ID", "").strip()
        secret = getattr(settings, "FACEBOOK_APP_SECRET", "").strip()
        redirect_uri = getattr(settings, "FACEBOOK_OAUTH_REDIRECT_URI", "").strip()
        if not all([app_id, secret, redirect_uri]):
            return _redirect_error("facebook_not_configured")

        token_res = requests.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": app_id,
                "redirect_uri": redirect_uri,
                "client_secret": secret,
                "code": code,
            },
            timeout=30,
        )
        if not token_res.ok:
            return _redirect_error("facebook_token_exchange")
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return _redirect_error("facebook_no_access_token")

        ui = requests.get(
            "https://graph.facebook.com/me",
            params={
                "fields": "id,email,first_name,last_name,middle_name",
                "access_token": access_token,
            },
            timeout=30,
        )
        if not ui.ok:
            return _redirect_error("facebook_userinfo")
        data = ui.json()
        email = data.get("email")
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        middle_name = data.get("middle_name") or ""
        try:
            user = get_or_create_user_from_oauth(
                email=email,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
            )
        except ValueError:
            return _redirect_error("facebook_no_email")
        a, r = issue_tokens_for_user(user)
        return _redirect_success(a, r)


class OAuthProvidersView(APIView):
    """Which OAuth providers are configured (for showing buttons in the SPA)."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "google": bool(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "").strip()),
                "facebook": bool(getattr(settings, "FACEBOOK_APP_ID", "").strip()),
            }
        )

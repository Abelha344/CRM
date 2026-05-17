"""Verify Clerk session JWTs using JWKS (used for /api/auth/clerk-token/ exchange)."""

from __future__ import annotations

import base64
import json

import jwt
from django.conf import settings
from jwt import PyJWKClient

# Small clock skew tolerance (Clerk session tokens are short-lived).
_LEEWAY_SECONDS = 60

# Clerk may issue RS*, PS*, ES*, or EdDSA session JWTs depending on key material / product version.
_CLERK_JWT_ALGORITHMS = [
    "RS256",
    "RS384",
    "RS512",
    "PS256",
    "PS384",
    "PS512",
    "ES256",
    "ES256K",
    "ES384",
    "ES512",
    "EdDSA",
]


def _issuer_candidates() -> list[str]:
    """Issuer URL(s) from env: one or comma-separated; normalized (no trailing slash)."""
    raw = getattr(settings, "CLERK_ISSUER", "").strip()
    if not raw:
        return []
    out = []
    for part in raw.split(","):
        s = part.strip().rstrip("/")
        if s:
            out.append(s)
    return out


def _unverified_payload(token: str) -> dict:
    parts = token.strip().split(".")
    if len(parts) != 3:
        raise ValueError("Token is not a valid JWT.")
    pad = "=" * (-len(parts[1]) % 4)
    raw = base64.urlsafe_b64decode(parts[1] + pad)
    return json.loads(raw.decode("utf-8"))


def _token_issuer(token: str) -> str | None:
    try:
        payload = _unverified_payload(token)
        iss = (payload.get("iss") or "").strip().rstrip("/")
        return iss or None
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def _jwks_urls_for_token(token: str) -> list[str]:
    """Prefer configured URL; also try `{iss}/.well-known/jwks.json` from the token (same Clerk app)."""
    seen: list[str] = []
    configured = getattr(settings, "CLERK_JWKS_URL", "").strip()
    if configured:
        seen.append(configured)
    token_iss = _token_issuer(token)
    if token_iss:
        derived = f"{token_iss}/.well-known/jwks.json"
        if derived not in seen:
            seen.append(derived)
    return seen


def _issuer_allowed(token_iss: str | None, allow: list[str]) -> bool:
    if not allow:
        return True
    if not token_iss:
        return False
    if token_iss in allow:
        return True
    for a in allow:
        try:
            host = a.split("://", 1)[-1]
            if token_iss.endswith(host) or host in token_iss:
                return True
        except Exception:
            continue
    return False


def _decode_with_signing_key(
    token: str,
    signing_key,
    *,
    audience: str | None,
    issuers: list[str],
) -> dict:
    # Must pass explicit options so PyJWT does not still verify `aud` / `iss` when unset in env.
    base_options: dict = {
        "verify_signature": True,
        "verify_exp": True,
        "verify_nbf": True,
        "verify_aud": bool(audience),
        "verify_iss": bool(issuers),
    }
    kwargs: dict = {
        "algorithms": _CLERK_JWT_ALGORITHMS,
        "leeway": _LEEWAY_SECONDS,
        "options": dict(base_options),
    }
    if audience:
        kwargs["audience"] = audience

    if issuers:
        for iss in issuers:
            kw = dict(kwargs)
            kw["issuer"] = iss
            kw["options"] = {**base_options, "verify_iss": True}
            try:
                return jwt.decode(token, signing_key.key, **kw)
            except jwt.InvalidIssuerError:
                continue
        out = dict(kwargs)
        out.pop("issuer", None)
        out["options"] = {**base_options, "verify_iss": False}
        return jwt.decode(token, signing_key.key, **out)

    out = dict(kwargs)
    out["options"] = {**base_options, "verify_iss": False}
    return jwt.decode(token, signing_key.key, **out)


def verify_clerk_session_token(token: str) -> dict:
    audience = getattr(settings, "CLERK_AUDIENCE", "").strip() or None
    issuers = _issuer_candidates()
    token_iss = _token_issuer(token)

    if issuers and token_iss is not None and not _issuer_allowed(token_iss, issuers):
        raise ValueError(
            f"JWT issuer {token_iss!r} does not match CLERK_ISSUER ({', '.join(issuers)}). "
            "Copy the Frontend API URL / JWT issuer from Clerk Dashboard → API keys → JWT verification "
            "for the same application as VITE_CLERK_PUBLISHABLE_KEY."
        )

    urls = _jwks_urls_for_token(token)
    if not urls:
        raise ValueError(
            "CLERK_JWKS_URL is not set and the token has no iss claim. "
            "Set CLERK_JWKS_URL and CLERK_ISSUER from Clerk Dashboard → JWT verification."
        )

    last: Exception | None = None
    for jwks_url in urls:
        try:
            jwks_client = PyJWKClient(jwks_url, cache_keys=True)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            return _decode_with_signing_key(
                token,
                signing_key,
                audience=audience,
                issuers=issuers,
            )
        except Exception as e:
            last = e
            continue

    assert last is not None
    raise last

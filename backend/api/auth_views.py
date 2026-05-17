import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .auth_serializers import EmailTokenObtainPairSerializer, RegisterSerializer
from .clerk_service import upsert_user_from_clerk_claims
from .clerk_verify import verify_clerk_session_token

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "last_name": user.last_name,
                    "middle_name": user.crm_profile.middle_name,
                    "role": user.crm_profile.role,
                    "clerk_id": user.crm_profile.clerk_id,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [AllowAny]


class EmailTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class ClerkTokenExchangeView(APIView):
    """
    Exchange a Clerk session JWT for SimpleJWT access + refresh (same tokens as email/password login).
    Authorization: Bearer <clerk_session_jwt>
    """

    # Default REST_FRAMEWORK uses JWTAuthentication, which treats every Bearer token as SimpleJWT.
    # Clerk session JWTs are not signed by Django — validation raises InvalidToken (401) before
    # this view runs. Disable global auth so we can read the Bearer Clerk token in post().
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        if not getattr(settings, "CLERK_JWKS_URL", "").strip():
            return Response(
                {"detail": "Clerk is not configured (set CLERK_JWKS_URL)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        auth = request.headers.get("Authorization") or ""
        if not auth.startswith("Bearer "):
            return Response(
                {"detail": "Authorization Bearer token required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        raw = auth[7:].strip()
        if not raw:
            return Response({"detail": "Missing token."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            claims = verify_clerk_session_token(raw)
            user = upsert_user_from_clerk_claims(claims)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            if settings.DEBUG:
                logger.warning("clerk-token rejected: %s: %s", type(e).__name__, e)
            body = {"detail": f"Invalid Clerk token: {e!s}"}
            if settings.DEBUG:
                body["error_type"] = type(e).__name__
            return Response(body, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )

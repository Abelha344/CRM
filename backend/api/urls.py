from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .auth_views import (
    ClerkTokenExchangeView,
    EmailTokenObtainPairView,
    EmailTokenRefreshView,
    RegisterView,
)
from .oauth_views import (
    FacebookOAuthCallbackView,
    FacebookOAuthStartView,
    GoogleOAuthCallbackView,
    GoogleOAuthStartView,
    OAuthProvidersView,
)
from .views import (
    AdminSystemLogListView,
    AdminUserDetailView,
    AdminUserListView,
    DashboardStatsView,
    LeadNoteViewSet,
    LeadViewSet,
    MeView,
    TaskViewSet,
    admin_export_leads_csv,
    health,
)

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"notes", LeadNoteViewSet, basename="leadnote")

urlpatterns = [
    path("health/", health),
    path("auth/oauth/providers/", OAuthProvidersView.as_view()),
    path("auth/oauth/google/start/", GoogleOAuthStartView.as_view()),
    path("auth/oauth/google/callback/", GoogleOAuthCallbackView.as_view()),
    path("auth/oauth/facebook/start/", FacebookOAuthStartView.as_view()),
    path("auth/oauth/facebook/callback/", FacebookOAuthCallbackView.as_view()),
    path("auth/register/", RegisterView.as_view()),
    path("auth/clerk-token/", ClerkTokenExchangeView.as_view()),
    path("auth/token/", EmailTokenObtainPairView.as_view()),
    path("auth/token/refresh/", EmailTokenRefreshView.as_view()),
    path("me/", MeView.as_view()),
    path("dashboard/stats/", DashboardStatsView.as_view()),
    path("admin/users/", AdminUserListView.as_view()),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view()),
    path("admin/logs/", AdminSystemLogListView.as_view()),
    path("admin/export/leads/", admin_export_leads_csv),
    path("", include(router.urls)),
]

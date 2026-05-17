import csv
from io import StringIO

from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_utils import user_has_admin_role, user_owner_scope_id
from .models import Lead, LeadNote, SystemLog, Task, UserProfile
from .permissions import IsAdmin, IsAgentOrAdmin
from .serializers import (
    LeadNoteSerializer,
    LeadSerializer,
    SystemLogSerializer,
    TaskSerializer,
    UserProfileRoleUpdateSerializer,
    UserProfileSerializer,
)


def _scoped_leads(request):
    qs = Lead.objects.all()
    if user_has_admin_role(request.user):
        return qs
    oid = user_owner_scope_id(request.user)
    if oid:
        return qs.filter(owner_id=oid)
    return qs


def _scoped_tasks(request):
    qs = Task.objects.select_related("lead")
    if user_has_admin_role(request.user):
        return qs
    oid = user_owner_scope_id(request.user)
    if oid:
        return qs.filter(lead__owner_id=oid)
    return qs


def _scoped_notes(request):
    qs = LeadNote.objects.select_related("lead")
    if user_has_admin_role(request.user):
        pass
    else:
        oid = user_owner_scope_id(request.user)
        if oid:
            qs = qs.filter(lead__owner_id=oid)
    lead_id = request.query_params.get("lead")
    if lead_id:
        qs = qs.filter(lead_id=lead_id)
    return qs.order_by("-created_at")


def _viewset_permissions():
    return [IsAuthenticated(), IsAgentOrAdmin()]


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["first_name", "last_name", "email", "company", "phone"]
    ordering_fields = ["created_at", "updated_at", "estimated_value", "last_name", "first_name"]
    ordering = ["-created_at"]

    def get_permissions(self):
        return _viewset_permissions()

    def get_queryset(self):
        qs = _scoped_leads(self.request).annotate(notes_count=Count("notes"))
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ["due_date", "created_at", "priority", "title"]
    ordering = ["completed", "-due_date", "-created_at"]

    def get_permissions(self):
        return _viewset_permissions()

    def get_queryset(self):
        qs = _scoped_tasks(self.request)
        lead_id = self.request.query_params.get("lead")
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        completed = self.request.query_params.get("completed")
        if completed is not None:
            qs = qs.filter(completed=completed.lower() in ("1", "true", "yes"))
        return qs


class LeadNoteViewSet(viewsets.ModelViewSet):
    serializer_class = LeadNoteSerializer
    pagination_class = None

    def get_permissions(self):
        return _viewset_permissions()

    def get_queryset(self):
        return _scoped_notes(self.request)


class MeView(APIView):
    """Current user: Django user + CRM profile (RBAC)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "crm_profile", None)
        if profile is None:
            return Response(
                {"detail": "Richi CRM profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        u = request.user
        return Response(
            {
                "id": u.id,
                "profile_id": profile.id,
                "username": u.username,
                "email": u.email or profile.email,
                "last_name": u.last_name,
                "middle_name": profile.middle_name,
                "role": profile.role,
                "clerk_id": profile.clerk_id,
            }
        )


class DashboardStatsView(APIView):
    """
    Aggregated KPIs. Scoped to the signed-in agent; admins see org-wide numbers.
    """

    def get_permissions(self):
        return _viewset_permissions()

    def get(self, request):
        leads = _scoped_leads(request)
        tasks = _scoped_tasks(request)

        total_leads = leads.count()
        pipeline_value = leads.aggregate(v=Sum("estimated_value"))["v"] or 0

        by_status = {key: leads.filter(status=key).count() for key, _ in Lead.Status.choices}

        open_tasks = tasks.filter(completed=False).count()
        overdue_tasks = tasks.filter(
            completed=False,
            due_date__lt=timezone.now(),
        ).count()

        won_rate = 0.0
        decided = leads.filter(status__in=[Lead.Status.QUALIFIED, Lead.Status.LOST]).count()
        if decided:
            won_rate = round(
                100.0 * leads.filter(status=Lead.Status.QUALIFIED).count() / decided,
                1,
            )

        return Response(
            {
                "total_leads": total_leads,
                "pipeline_value": str(pipeline_value),
                "by_status": by_status,
                "open_tasks": open_tasks,
                "overdue_tasks": overdue_tasks,
                "qualified_rate_when_decided": won_rate,
            }
        )


def _admin_permissions():
    return [IsAuthenticated(), IsAdmin()]


class AdminUserListView(generics.ListAPIView):
    queryset = UserProfile.objects.select_related("django_user").all()
    serializer_class = UserProfileSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["clerk_id", "email", "django_user__username"]
    ordering_fields = ["created_at", "updated_at", "role", "email"]
    ordering = ["-created_at"]

    def get_permissions(self):
        return _admin_permissions()


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserProfile.objects.select_related("django_user").all()
    lookup_field = "pk"

    def get_permissions(self):
        return _admin_permissions()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserProfileRoleUpdateSerializer
        return UserProfileSerializer

    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()
        if profile.role != UserProfile.Role.AGENT:
            return Response(
                {"detail": "Only agents can be terminated. Demote an admin to agent first if needed."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if profile.django_user_id and profile.django_user_id == request.user.pk:
            return Response(
                {"detail": "You cannot terminate your own account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        actor = getattr(request.user, "crm_profile", None)
        actor_clerk_id = (actor.clerk_id or "") if actor else ""
        if not actor_clerk_id and request.user.is_authenticated:
            actor_clerk_id = str(request.user.pk)

        lead_q = Q()
        if profile.clerk_id:
            lead_q |= Q(owner_id=profile.clerk_id)
        if profile.django_user_id:
            lead_q |= Q(owner_id=str(profile.django_user_id))
        if lead_q:
            Lead.objects.filter(lead_q).update(owner_id="")

        label = (
            profile.django_user.get_username()
            if profile.django_user_id
            else (profile.clerk_id or f"profile:{profile.pk}")
        )
        SystemLog.objects.create(
            level=SystemLog.Level.WARNING,
            message=f"Agent terminated: {label} (profile id={profile.pk})",
            actor_clerk_id=actor_clerk_id,
            metadata={"event": "agent_terminated", "profile_id": profile.pk},
        )

        if profile.django_user_id:
            User.objects.filter(pk=profile.django_user_id).delete()
        else:
            profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminSystemLogListView(generics.ListAPIView):
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ["created_at", "level"]
    ordering = ["-created_at"]

    def get_permissions(self):
        return _admin_permissions()


@api_view(["GET"])
def admin_export_leads_csv(request):
    for p in _admin_permissions():
        if not p.has_permission(request, None):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
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
            "created_at",
            "updated_at",
        ]
    )
    qs = Lead.objects.all().order_by("-created_at")
    for lead in qs.iterator(chunk_size=500):
        writer.writerow(
            [
                lead.id,
                lead.owner_id,
                lead.first_name,
                lead.last_name,
                lead.email,
                lead.phone,
                lead.company,
                lead.status,
                lead.source,
                lead.estimated_value,
                lead.created_at.isoformat() if lead.created_at else "",
                lead.updated_at.isoformat() if lead.updated_at else "",
            ]
        )

    response = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="leads_export.csv"'
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})

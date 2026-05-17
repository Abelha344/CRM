from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User

from .models import Lead, LeadNote, SystemLog, Task, UserProfile


class UserProfileInline(admin.StackedInline):
    """CRM role and identity — new registrations default to Agent; promote to Admin here."""

    model = UserProfile
    can_delete = False
    extra = 0
    fk_name = "django_user"
    fields = ("role", "email", "clerk_id", "middle_name")
    readonly_fields = ("clerk_id",)
    verbose_name = "CRM profile"


class UserAdmin(DjangoUserAdmin):
    inlines = (UserProfileInline,)


# Replace default User admin so staff can set Admin / Agent on the linked CRM profile.
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "email",
        "company",
        "status",
        "source",
        "owner_id",
        "created_at",
    )
    list_filter = ("status", "source")
    search_fields = ("first_name", "last_name", "email", "company", "owner_id")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "lead", "completed", "priority", "due_date", "created_at")
    list_filter = ("completed", "priority")


@admin.register(LeadNote)
class LeadNoteAdmin(admin.ModelAdmin):
    list_display = ("lead", "body", "created_at")
    search_fields = ("body",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Standalone CRM profiles. New accounts default to **Agent**; use **role** to promote to **Admin**.
    You can also change role under Authentication → Users → CRM profile inline.
    """

    list_display = ("django_user", "clerk_id", "email", "role", "created_at", "updated_at")
    list_display_links = ("django_user",)
    list_filter = ("role",)
    list_editable = ("role",)
    search_fields = ("clerk_id", "email", "django_user__username")
    readonly_fields = ("created_at", "updated_at", "clerk_id")
    fieldsets = (
        (None, {"fields": ("django_user", "role", "email", "middle_name", "clerk_id")}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        role_field = form.base_fields.get("role")
        if role_field is not None:
            role_field.help_text = (
                "New registrations default to Agent. Choose Admin to grant admin UI and API access."
            )
        return form


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ("level", "message", "actor_clerk_id", "created_at")
    list_filter = ("level",)
    search_fields = ("message", "actor_clerk_id")
    readonly_fields = ("created_at",)

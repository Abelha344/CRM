from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    """CRM role and identity. Links to Django User (email/password) and/or legacy Clerk id."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        AGENT = "AGENT", "Agent"

    django_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="crm_profile",
    )
    middle_name = models.CharField(max_length=100, blank=True, default="")
    clerk_id = models.CharField(max_length=128, null=True, blank=True, unique=True, db_index=True)
    email = models.EmailField(blank=True, default="")
    role = models.CharField(
        max_length=16,
        choices=Role.choices,
        default=Role.AGENT,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.django_user_id:
            return f"{self.django_user.username} ({self.role})"
        return f"{self.clerk_id or '—'} ({self.role})"


class SystemLog(models.Model):
    """Append-only audit trail for admin visibility."""

    class Level(models.TextChoices):
        DEBUG = "debug", "Debug"
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"

    level = models.CharField(
        max_length=16,
        choices=Level.choices,
        default=Level.INFO,
        db_index=True,
    )
    message = models.TextField()
    actor_clerk_id = models.CharField(max_length=128, blank=True, default="", db_index=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.message[:80]


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        QUALIFIED = "qualified", "Qualified"
        LOST = "lost", "Lost"

    class Source(models.TextChoices):
        WEBSITE = "website", "Website"
        REFERRAL = "referral", "Referral"
        LINKEDIN = "linkedin", "LinkedIn"
        GOOGLE = "google", "Google"
        EVENT = "event", "Event"
        COLD_OUTREACH = "cold_outreach", "Cold outreach"
        OTHER = "other", "Other"

    owner_id = models.CharField(max_length=128, db_index=True, blank=True, default="")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=200, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )
    source = models.CharField(
        max_length=32,
        choices=Source.choices,
        default=Source.OTHER,
    )
    estimated_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner_id", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Task(models.Model):
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    priority = models.PositiveSmallIntegerField(
        default=2,
        help_text="1=high, 2=normal, 3=low",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class LeadNote(models.Model):
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    owner_id = models.CharField(max_length=128, db_index=True, blank=True, default="")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.body[:50]

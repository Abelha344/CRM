from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Lead, SystemLog


@receiver(post_save, sender=Lead)
def log_lead_change(sender, instance, created, **kwargs):
    SystemLog.objects.create(
        level=SystemLog.Level.INFO,
        message=(
            f"Lead {'created' if created else 'updated'}: {instance.email} (id={instance.id})"
        ),
        actor_clerk_id=instance.owner_id or "",
        metadata={"lead_id": instance.id, "event": "lead_created" if created else "lead_updated"},
    )

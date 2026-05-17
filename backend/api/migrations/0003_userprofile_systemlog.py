# Generated manually for RBAC models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_leadnote_lead_estimated_value_lead_last_contacted_at_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("clerk_id", models.CharField(db_index=True, max_length=128, unique=True)),
                ("email", models.EmailField(blank=True, default="", max_length=254)),
                (
                    "role",
                    models.CharField(
                        choices=[("ADMIN", "Admin"), ("AGENT", "Agent")],
                        db_index=True,
                        default="AGENT",
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SystemLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "level",
                    models.CharField(
                        choices=[
                            ("debug", "Debug"),
                            ("info", "Info"),
                            ("warning", "Warning"),
                            ("error", "Error"),
                        ],
                        db_index=True,
                        default="info",
                        max_length=16,
                    ),
                ),
                ("message", models.TextField()),
                ("actor_clerk_id", models.CharField(blank=True, db_index=True, default="", max_length=128)),
                ("metadata", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]

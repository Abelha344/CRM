from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api", "0003_userprofile_systemlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="django_user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="crm_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="middle_name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AlterField(
            model_name="userprofile",
            name="clerk_id",
            field=models.CharField(blank=True, db_index=True, max_length=128, null=True, unique=True),
        ),
    ]

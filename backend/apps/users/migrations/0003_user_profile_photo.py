from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_zona_alter_user_date_of_birth_alter_user_dni_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_photo",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="users/profile/",
            ),
        ),
    ]

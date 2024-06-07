# Generated by Django 5.0.6 on 2024-06-06 14:44

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0005_user_friends_remove_user_blocked_user_blocked'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='blocked',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='user',
            name='friends',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL),
        ),
    ]
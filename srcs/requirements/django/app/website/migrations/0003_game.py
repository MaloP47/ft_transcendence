# Generated by Django 5.0.6 on 2024-06-21 10:22

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0002_auto_20240617_1407'),
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('p2Local', models.TextField(blank=True, default='')),
                ('ai', models.IntegerField(default=0)),
                ('p1Score', models.IntegerField(default=0)),
                ('p2Score', models.IntegerField(default=0)),
                ('scoreToWin', models.IntegerField(default=10)),
                ('ballSpeed', models.FloatField(default=8)),
                ('bonuses', models.BooleanField(default=True)),
                ('p1Left', models.IntegerField(default=65)),
                ('p1Right', models.IntegerField(default=68)),
                ('p2Left', models.IntegerField(default=37)),
                ('p2Right', models.IntegerField(default=39)),
                ('gameType', models.IntegerField(default=0)),
                ('forfeit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='forfeit', to=settings.AUTH_USER_MODEL)),
                ('p1', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='p1', to=settings.AUTH_USER_MODEL)),
                ('p2', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='p2', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
	profilPicture = models.ImageField(verbose_name="Profil picture", upload_to="profilPicture", default="profilPicture/default.jpg")
	online = models.BooleanField(default=True)
	blocked = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)

class Room(models.Model):
	id = models.AutoField(primary_key=True)
	users = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True)
	publicRoom = models.BooleanField(default=False)

class Message(models.Model):
	message = models.TextField()
	date = models.DateTimeField(auto_now_add=True)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	user = models.ForeignKey(User, on_delete=models.CASCADE)

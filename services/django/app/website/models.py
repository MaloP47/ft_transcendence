from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
	profilPicture = models.ImageField(verbose_name="Profil picture", upload_to="profilPicture", default="profilPicture/default.jpg")
	online = models.BooleanField(default=True)
	friends = models.ManyToManyField('self', blank=True)

class BlockedUser(models.Model):
	id = models.AutoField(primary_key=True)
	userFrom = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="userFrom", blank=True, null=True)
	userBlocked = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="userBlocked", blank=True, null=True)

class Room(models.Model):
	id = models.AutoField(primary_key=True)
	users = models.ManyToManyField(User, blank=True)
	publicRoom = models.BooleanField(default=False)

class Message(models.Model):
	message = models.TextField()
	date = models.DateTimeField(auto_now_add=True)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	read = models.BooleanField(default=False)

class FriendRequest(models.Model):
	userFrom = models.ForeignKey(User, related_name="user_from", on_delete=models.DO_NOTHING)
	userTo = models.ForeignKey(User, related_name="user_to",  on_delete=models.DO_NOTHING)
	accepted = models.BooleanField(default=False)

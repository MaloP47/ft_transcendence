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

class Game(models.Model):
	id = models.AutoField(primary_key=True)
	date = models.DateTimeField(auto_now_add=True)
	p1 = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True, related_name="p1")
	p2 = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True, related_name="p2")
	p2Local = models.TextField(default="")
	forfeit = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True, related_name="forfeit")
	ai = models.IntegerField(default=0)
	p1Score = models.IntegerField(default=0)
	p2Score = models.IntegerField(default=0)
	scoreToWin = models.IntegerField(default=10)
	ballSpeed = models.FloatField(default=8)
	bonuses = models.BooleanField(default=True)
	p1Left = models.IntegerField(default=65)
	p1Right = models.IntegerField(default=68)
	p2Left = models.IntegerField(default=37)
	p2Right = models.IntegerField(default=39)
	gameType = models.IntegerField(default=0) # 0->local vs AI // 1->local 1 vs 1 // 2->remote 1 vs 1

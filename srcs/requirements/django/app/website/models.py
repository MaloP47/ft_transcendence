from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
	profilPicture = models.ImageField(verbose_name="Profil picture", upload_to="profilPicture", default="profilPicture/default.jpg")

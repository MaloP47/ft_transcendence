from django.contrib.auth.forms import UserCreationForm
from website.models import User as CustomUser


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
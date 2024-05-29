from django import forms
from .models import TestTable

from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm



class TestForm(forms.ModelForm):
    class Meta:
        model = TestTable
        fields = ['name', 'email']


class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
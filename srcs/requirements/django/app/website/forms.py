import re
from django.core.exceptions import ValidationError
from django.contrib.auth.forms import UserCreationForm
from django import forms
from website.models import User as CustomUser


def validate_password_strength(value):
    """
    Validate that the password has at least one digit, one special character,
    one uppercase letter, and one lowercase letter.
    """
    if not re.findall(r'[A-Z]', value):
        raise ValidationError('Password must contain at least one uppercase letter.')
    if not re.findall(r'[a-z]', value):
        raise ValidationError('Password must contain at least one lowercase letter.')
    if not re.findall(r'[0-9]', value):
        raise ValidationError('Password must contain at least one digit.')
    if not re.findall(r'[!@#$%^&*(),.?":{}|<>]', value):
        raise ValidationError('Password must contain at least one special character.')


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=False, help_text="Required. Enter a valid email address.")
    profilPicture = forms.ImageField(required=False, help_text="Optional. Upload a profile photo.")
    username = forms.CharField(required=False, help_text="Required. Enter a valid username.")
    password1 = forms.CharField(required=False, help_text="Required. Enter a valid password.")
    password2 = forms.CharField(required=False, help_text="Required. Enter the same password as above.")




    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ("username", "email", "password1", "password2", "profilPicture")
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        username = cleaned_data.get('username')
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        if not username:
            self.add_error('username', 'Username field is required.')
        if not email:
            self.add_error('email', 'Email field is required.')
        elif CustomUser.objects.filter(email=email).exists():
            self.add_error('email', 'Email address must be unique.')

        if not password1:
            self.add_error('password1', 'Password field is required.')

        if not password2:
            self.add_error('password2', 'Password confirmation field is required.')
        elif password1 and password2 and password1 != password2:
            self.add_error('password2', 'Passwords do not match.')
        if password1:
            try:
                validate_password_strength(password1)
            except ValidationError as e:
                self.add_error('password1', e)
            return cleaned_data

    def save(self, commit=True):
        user = super(CustomUserCreationForm, self).save(commit=False)
        user.email = self.cleaned_data['email']
        if 'profilPicture' in self.cleaned_data:
            user.profilPicture = self.cleaned_data['profilPicture']

        if commit:
            user.save()
        return user


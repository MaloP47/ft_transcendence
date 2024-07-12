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
    email = forms.EmailField(required=True, help_text="Required. Enter a valid email address.")
    profilPicture = forms.ImageField(required=False, help_text="Optional. Upload a profile photo.")

    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ("username", "email", "password1", "password2", "profilPicture")

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError("Email address must be unique.")
        return email

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match.")

        # Validate password strength
        validate_password_strength(password1)

        return password2

    def save(self, commit=True):
        user = super(CustomUserCreationForm, self).save(commit=False)
        user.email = self.cleaned_data['email']
        if 'profilPicture' in self.cleaned_data:
            user.profilPicture = self.cleaned_data['profilPicture']

        if commit:
            user.save()
        return user

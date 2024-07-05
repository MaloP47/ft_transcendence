from django.contrib.auth.forms import UserCreationForm
from django import forms
from website.models import User as CustomUser


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

    def save(self, commit=True):
        CustomUser = super(CustomUserCreationForm, self).save(commit=False)
        CustomUser.email = self.cleaned_data['email']
        if 'profilPicture' in self.cleaned_data:
            CustomUser.profilPicture = self.cleaned_data['profilPicture']

        if commit:
            CustomUser.save()
        return CustomUser

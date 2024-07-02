from django import forms
from django.contrib.auth.forms import UserCreationForm
from website.models import User as CustomUser

class editProfileForm(forms.Form):
	profile_picture = forms.ImageField(
		widget=forms.FileInput(
			attrs = {
				'class': 'form-control mb-3',
				'style': 'min-height:38px; width:400px',
			}
		)
	)
	username = forms.CharField(
		widget=forms.TextInput(
			attrs = {
				'placeholder': 'username',
				'class': 'form-control',
			}
		)
	)
	password = forms.CharField(
		widget=forms.PasswordInput(
			attrs = {
				'class': 'form-control',
			}
		)
	)
	confirm_password = forms.CharField(
		widget=forms.PasswordInput(
			attrs = {
				'class': 'form-control',
			}
		)
	)


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

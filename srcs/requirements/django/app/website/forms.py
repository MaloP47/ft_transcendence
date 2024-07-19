from django import forms
from website.models import User as CustomUser

class editProfileForm(forms.Form):
	profile_picture = forms.ImageField(
		widget=forms.FileInput(
			attrs = {
				'class': 'form-control mb-3',
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
	email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={
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

	class Meta:
			model = CustomUser
			fields = ("username", "email", "password1", "password2", "profilPicture")
	def save(self, commit=True):
		user = super(editProfileForm, self).save(commit=False)
		user.email = self.cleaned_data['email']
		if 'profilPicture' in self.cleaned_data:
			user.profilPicture = self.cleaned_data['profilPicture']

		if commit:
			user.save()
		return user

from django import forms

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

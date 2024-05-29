from django import forms

class TestsForm(forms.Form):
	name = forms.CharField(max_length=100)
	email = forms.EmailField(label='E-Mail')
	# category = forms.ChoiceField(choices=[('question', 'Question'), ('other', 'Other')])
	# subject = forms.CharField(max_length=100, required=False)
	# message = forms.CharField(widget=forms.Textarea)
	# body = forms.CharField(widget=forms.Textarea, required=False)
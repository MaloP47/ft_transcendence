from django import forms
from .models import TestTable


class TestForm(forms.ModelForm):
    class Meta:
        model = TestTable
        fields = ['name', 'email']
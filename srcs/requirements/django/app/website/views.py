from django.shortcuts import render
from django.http import HttpResponse
from .forms import TestsForm
from .models import TestTable
import logging

logger = logging.getLogger('django')


def index(request):
	# form = TestsForm()
	# return render(request, 'website/form.html', {'form': TestsForm()})
    return render(request, "website/index.html");


def forms(request):
    if request.method == 'POST':
        form = TestsForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            
            # Enregistrement des données dans la table
            TestTable.objects.create(name=name, email=email)
            
            # Logging
            logger.debug(f"Saved: {name}, {email}")
            
            return HttpResponse("Thank you for your feedback")

    form = TestsForm()
    return render(request, 'website/form.html', {'forms': form})


def display_tests(request):
    test_data = TestTable.objects.all()
    return render(request, 'website/test_disp.html', {'test_data': test_data})
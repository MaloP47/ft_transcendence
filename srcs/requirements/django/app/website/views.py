from django.shortcuts import render, redirect
from django.http import HttpResponse
from .models import TestTable
from .forms import TestForm
import logging

logger = logging.getLogger('django')


def index(request):
    return render(request, "website/index.html");



def test_form_view(request):
    if request.method == 'POST':
        form = TestForm(request.POST)
        if form.is_valid():
            form.save()
            # return redirect('test-disp')	
    else:
        form = TestForm()
    return render(request, 'website/test_form.html', {'form': form})

def test_disp_view(request):
    entries = TestTable.objects.all()
    return render(request, 'website/test_disp.html', {'entries': entries})
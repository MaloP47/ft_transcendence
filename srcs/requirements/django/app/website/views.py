from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from .models import TestTable
from .forms import TestForm
import logging

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

logger = logging.getLogger('django')


def index(request):
    return render(request, "website/index.html");


def test_form_view(request):
    if request.method == 'POST':
        form = TestForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({'message': 'Form submitted successfully!'}, status=200)
        else:
            errors = form.errors.as_json()
            return JsonResponse({'errors': errors}, status=400)
    else:
        form = TestForm()
        return render(request, 'website/test_form.html', {'form': form})


def test_disp_view(request):
    entries = TestTable.objects.all()
    return render(request, 'website/test_disp.html', {'entries': entries})
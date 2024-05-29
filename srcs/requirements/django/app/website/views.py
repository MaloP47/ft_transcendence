from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from .models import TestTable
from .forms import TestForm
from django.template.loader import render_to_string
import logging

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


from django.contrib.auth import login, authenticate
from .forms import SignUpForm

logger = logging.getLogger('django')


def index(request):
    return render(request, "website/index.html");


def test_form_view(request):
    if request.method == 'POST':
        form = TestForm(request.POST)
        if form.is_valid():
            saved_data = form.save()
            return JsonResponse({
                'message': 'Form submitted successfully!',
                'data': {
                    'name': saved_data.name,
                    'email': saved_data.email,
                    # 'coucou': render_to_string('website/test_disp.html', {'jean': 'michel'}),
                }
            }, status=200)
        else:
            errors = form.errors.as_json()
            return JsonResponse({'errors': errors}, status=400)
    else:
        form = TestForm()
        return render(request, 'website/test_form.html', {'form': form})


def test_disp_view(request):
    entries = TestTable.objects.all()
    return render(request, 'website/test_disp.html', {'entries': entries})



def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            user.refresh_from_db()  # Load the profile instance created by the signal
            user.email = form.cleaned_data.get('email')
            user.save()
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=user.username, password=raw_password)
            login(request, user)
            return redirect('login')
    else:
        form = SignUpForm()
    return render(request, 'registration/signup.html', {'form': form})
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



from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer


from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from two_factor.views import OTPRequiredMixin

from .serializers import UserSerializer



# views.py
from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice
from two_factor.views import LoginView as BaseLoginView
from .forms import LoginForm



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



class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer




def grafana_dashboard(request):
    return render(request, 'website/grafana_dashboard.html')



class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.get(username=request.data['username'])
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class LoginView(OTPRequiredMixin, generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        # Ajouter la logique de connexion ici
        pass
    



class LoginView(BaseLoginView):
    form_class = LoginForm

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            otp_token = form.cleaned_data['otp_token']

            user = authenticate(request, username=username, password=password)
            if user is not None:
                # Verify OTP token
                for device in devices_for_user(user):
                    if device.verify_token(otp_token):
                        login(request, user)
                        return redirect('home')
                form.add_error('otp_token', 'Invalid 2FA code.')
            else:
                form.add_error(None, 'Invalid username or password.')

        return render(request, 'registration/login.html', {'form': form})

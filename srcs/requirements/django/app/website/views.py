from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import login, logout, authenticate
from django.template.loader import render_to_string

def index(request):
    return render(request, "website/index.html");

def getUser(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
           return JsonResponse({
                'authenticated': True,
                'username': request.user.username,
                'email': request.user.email,
                'last_login': request.user.last_login,
            })
        else:
            return JsonResponse({
                'authenticated': False,
            })

def logoutUser(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            logout(request);
            return JsonResponse({
                'success': True,
            })
    return JsonResponse({
        'success': False,
    })

def signinUser(request):
    if request.method == 'POST':
        if request.user.is_authenticated == False:
            user = authenticate(username="admin", password="admin")
            if user is not None:
                login(request, user)
                return JsonResponse({ 'success': True, 'user': request.POST["username"] })
            else:
                return JsonResponse({ 'success': False })
    return JsonResponse({
        'success': False,
    })

def profilMenu(request):
    if request.method == 'POST':
        return JsonResponse({
            'success': True,
            'html': render_to_string('website/profilMenu.html'),
        });

def loginForm(request):
    if request.method == 'POST':
        return JsonResponse({
            'success': True,
            'html': render_to_string('website/login.html'),
        });

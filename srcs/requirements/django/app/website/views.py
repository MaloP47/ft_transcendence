from django.http import JsonResponse
from django.shortcuts import render

def index(request):
    return render(request, "website/index.html");

def getUser(request):
    if request.method == 'POST':
        return JsonResponse({'ok':'super'})
    else:
        return JsonResponse({'ok':'bof'})

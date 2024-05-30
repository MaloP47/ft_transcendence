from django.urls import path, re_path

from . import views

urlpatterns = [
    path('api/user/', views.getUser, name="getUser"),
    re_path(r'^', views.index, name="index"),
]

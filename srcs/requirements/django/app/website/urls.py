from django.urls import path, re_path

from . import views

urlpatterns = [
    path('api/user/logout/', views.logoutUser, name="logout"),
    path('api/user/', views.getUser, name="getUser"),
    path('api/view/profilMenu/', views.profilMenu, name="profilMenu"),
    re_path(r'^', views.index, name="index"),
]

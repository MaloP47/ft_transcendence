from django.urls import path, re_path

from . import views

urlpatterns = [
	path('api/user/logout/', views.logoutUser, name="logout"),
	path('api/user/signin/', views.signinUser, name="signin"),
	path('api/user/search/', views.searchUser, name="searchUser"),
	path('api/user/', views.getUser, name="getUser"),
	path('api/view/profilMenu/', views.profilMenu, name="profilMenu"),
	path('api/view/login/', views.loginForm, name="loginForm"),
	path('api/view/register/', views.registerForm, name="registerForm"),
	path('api/view/home/', views.homeView, name="homeView"),
	path('api/view/chatView/', views.chatView, name="chatView"),
	path('api/view/chatUserView/', views.chatUserView, name="chatUserView"),
	path('api/view/chatMessageView/', views.chatMessageView, name="chatMessageView"),
	path('', views.index, name="index"),
#	re_path(r'^', views.index, name="index"),
]

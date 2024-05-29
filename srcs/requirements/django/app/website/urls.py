from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
	path("forms/", views.forms, name="forms"),
	path('test-disp/', views.display_tests, name='display_tests'),
]

from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
	path('test-form/', views.test_form_view, name='test-form'),
    path('test-disp/', views.test_disp_view, name='test-disp'),
]

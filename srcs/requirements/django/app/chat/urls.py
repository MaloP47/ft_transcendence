from django.urls import path
from .views import chat_view

app_name = 'chat'

urlpatterns = [
    path('', chat_view, name='chat_view'),
]

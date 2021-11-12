from django.urls import path
from .views import index

# need to add app name for other apps to recognize. e.g. redirect
app_name = 'frontend'

urlpatterns = [
    path('', index, name=''),
    path('join', index),
    path('create', index),
    path('room/<str:roomCode>', index),
    path('info', index)
]
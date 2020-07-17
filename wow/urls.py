from django.urls import path

from . import views

app_name = 'wow'

urlpatterns = [
    path('hello', views.hello, name='hello'),
]

"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from api import views

router = DefaultRouter()
router.register(r'songs', views.SongViewSet)
router.register(r'libraries', views.LibraryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('song-form/', views.song_form, name='song_form'),
    path('libraries/', views.library_list, name='library_list'),
    path('libraries/<int:pk>/', views.library_detail, name='library_detail'),
    path('libraries/create/', views.library_create, name='library_create'),
    path('libraries/<int:pk>/update/', views.library_update, name='library_update'),
    path('libraries/<int:pk>/delete/', views.library_delete, name='library_delete'),
    path('songs/<int:pk>/', views.song_detail, name='song_detail'),
    path('songs/<int:pk>/update/', views.song_update, name='song_update'),
    path('songs/<int:pk>/delete/', views.song_delete, name='song_delete'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

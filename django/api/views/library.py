from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404, render, redirect
from django.db.models import Q
from api.models.user import User
from api.models.song import Song
from api.models.library import Library
from api.models.creator import Creator
from api.models.accessment import Accessment
from api.models.song_generation import SongGeneration
from api.models.admin_user import Admin
from api.serializer import SongSerializer, LibrarySerializer

class LibraryViewSet(viewsets.ModelViewSet):
    queryset = Library.objects.all()
    serializer_class = LibrarySerializer
    permission_classes = [AllowAny]  # Adjust permissions as needed

    def get_queryset(self):
        queryset = Library.objects.all()
        # Add filtering logic if needed
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


def library_list(request):
    libraries = Library.objects.all()
    return render(request, 'api/library_list.html', {'libraries': libraries})


def library_detail(request, pk):
    try:
        library = Library.objects.get(pk=pk)
        songs = library.songs.all()
        return render(request, 'api/library_detail.html', {
            'library': library,
            'songs': songs
        })
    except Library.DoesNotExist:
        return render(request, 'api/library_list.html', {'error': 'Library not found.', 'libraries': Library.objects.all()})


def library_create(request):
    context = {}
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        owner_id = request.POST.get('owner')

        if not name:
            context['error'] = 'Name is required.'
        elif not owner_id:
            context['error'] = 'Owner is required.'
        else:
            try:
                owner = User.objects.get(id=owner_id)
                library = Library(name=name, description=description, owner=owner)
                library.save()
                context['success'] = 'Library has been created successfully.'
            except User.DoesNotExist:
                context['error'] = 'Invalid owner selected.'

    context['users'] = User.objects.all()
    return render(request, 'api/library_form.html', context)


def library_update(request, pk):
    try:
        library = Library.objects.get(pk=pk)
    except Library.DoesNotExist:
        return render(request, 'api/library_form.html', {'error': 'Library not found.'})

    context = {'library': library}
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        owner_id = request.POST.get('owner')

        if not name:
            context['error'] = 'Name is required.'
        elif not owner_id:
            context['error'] = 'Owner is required.'
        else:
            try:
                owner = User.objects.get(id=owner_id)
                library.name = name
                library.description = description
                library.owner = owner
                library.save()
                context['success'] = 'Library has been updated successfully.'
            except User.DoesNotExist:
                context['error'] = 'Invalid owner selected.'

    context['users'] = User.objects.all()
    return render(request, 'api/library_form.html', context)


def library_delete(request, pk):
    try:
        library = Library.objects.get(pk=pk)
    except Library.DoesNotExist:
        return render(request, 'api/library_list.html', {'error': 'Library not found.', 'libraries': Library.objects.all()})

    if request.method == 'POST':
        library.delete()
        return render(request, 'api/library_list.html', {'success': 'Library has been deleted successfully.', 'libraries': Library.objects.all()})

    return render(request, 'api/library_delete.html', {'library': library})




    
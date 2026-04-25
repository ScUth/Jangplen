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

# Create your views here.


class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [AllowAny]  # Adjust permissions as needed

    def get_queryset(self):
        queryset = Song.objects.all()
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
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


def song_detail(request, pk):
    try:
        song = Song.objects.get(pk=pk)
        return render(request, 'api/song_detail.html', {'song': song})
    except Song.DoesNotExist:
        return render(request, 'api/song_form.html', {'error': 'Song not found.'})


def song_update(request, pk):
    try:
        song = Song.objects.get(pk=pk)
    except Song.DoesNotExist:
        return render(request, 'api/song_form.html', {'error': 'Song not found.'})

    context = {'song': song, 'libraries': Library.objects.all()}
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        lyrics = request.POST.get('lyrics', '').strip()
        genre = request.POST.get('genre', '').strip()
        mood = request.POST.get('mood', '').strip()
        based_singer = request.POST.get('based_singer', '').strip()
        description = request.POST.get('description', '').strip()
        file = request.FILES.get('file')
        library_id = request.POST.get('library_id')

        if not title:
            context['error'] = 'Title is required.'
        else:
            song.title = title
            song.lyrics = lyrics
            song.genre = genre
            song.mood = mood
            song.based_singer = based_singer
            song.description = description

            if library_id:
                try:
                    song.library = Library.objects.get(pk=library_id)
                except Library.DoesNotExist:
                    pass
            else:
                song.library = None

            if file:
                song.file = file
            song.save()

            if song.library:
                return redirect('library_detail', pk=song.library.pk)
            else:
                context['success'] = 'Song has been updated successfully.'

    return render(request, 'api/song_form.html', context)


def song_delete(request, pk):
    try:
        song = Song.objects.get(pk=pk)
        library_id = song.library.id if song.library else None
    except Song.DoesNotExist:
        return render(request, 'api/library_list.html', {'error': 'Song not found.', 'libraries': Library.objects.all()})

    if request.method == 'POST':
        song.delete()
        if library_id:
            return render(request, 'api/library_detail.html', {
                'library': Library.objects.get(pk=library_id),
                'songs': Library.objects.get(pk=library_id).songs.all(),
                'success': 'Song has been deleted successfully.'
            })
        else:
            return render(request, 'api/song_form.html', {'success': 'Song has been deleted successfully.'})

    return render(request, 'api/song_delete.html', {'song': song})


def song_form(request, pk=None):
    context = {}
    library = None
    library_id = request.GET.get(
        'library_id') or request.POST.get('library_id')

    if library_id:
        try:
            library = Library.objects.get(pk=library_id)
            context['library'] = library
        except Library.DoesNotExist:
            context['error'] = 'Library not found.'

    context['libraries'] = Library.objects.all()

    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        lyrics = request.POST.get('lyrics', '').strip()
        genre = request.POST.get('genre', '').strip()
        mood = request.POST.get('mood', '').strip()
        based_singer = request.POST.get('based_singer', '').strip()
        description = request.POST.get('description', '').strip()
        file = request.FILES.get('file')

        if not title:
            context['error'] = 'Title is required.'
        else:
            song = Song(
                title=title,
                lyrics=lyrics,
                genre=genre,
                mood=mood,
                based_singer=based_singer,
                description=description,
                library=library,
            )
            if file:
                song.file = file
            song.save()

            # Redirect to library detail if library was specified
            if library:
                return redirect('library_detail', pk=library.pk)
            else:
                context['success'] = 'Song has been created successfully.'

    return render(request, 'api/song_form.html', context)

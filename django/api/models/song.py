from django.db import models
from .accessment import Accessment
from .library import Library
from .song_generation import SongGeneration


class Song(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='songs/', blank=True, null=True)
    audio_url = models.URLField(max_length=1024, blank=True, null=True)
    thumbnail_url = models.URLField(max_length=1024, blank=True, null=True)
    lyrics = models.TextField(blank=True)
    genre = models.CharField(max_length=100, blank=True)
    mood = models.CharField(max_length=100, blank=True)
    based_singer = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    assessment = models.CharField(
        max_length=20,
        choices=Accessment.choices,
        default=Accessment.PENDING,
    )

    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='songs',
        null=True,
        blank=True,
    )

    generation = models.ForeignKey(
        SongGeneration,
        on_delete=models.SET_NULL,
        related_name='songs',
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.title

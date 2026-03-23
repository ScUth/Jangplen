from django.db import models
from .accessment import Accessment
from .library import Library
from .song_generation import SongGeneration


class Song(models.Model):
    title = models.CharField(max_length=255)
    url = models.URLField(blank=True)
    lyrics = models.TextField(blank=True)
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

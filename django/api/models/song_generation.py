from django.db import models
from .creator import Creator
from .library import Library


class SongGeneration(models.Model):
    creator = models.ForeignKey(Creator, on_delete=models.CASCADE, related_name='song_generations')
    library = models.ForeignKey(Library, on_delete=models.CASCADE, related_name='song_generations')
    prompt = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SongGeneration {self.pk} by {self.creator}"

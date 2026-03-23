from django.contrib import admin
from .models import User, Admin, Library, Creator, SongGeneration, Song

admin.site.register(User)
admin.site.register(Admin)
admin.site.register(Library)
admin.site.register(Creator)
admin.site.register(SongGeneration)
admin.site.register(Song)


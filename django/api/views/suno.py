"""
Suno API views
==============
POST /api/suno/generate/             — start a generation, returns { task_id, library_id }
GET  /api/suno/status/<task_id>/     — poll status; returns raw Suno data on SUCCESS (no DB save)
POST /api/suno/save/                 — user confirms: saves song to chosen library
GET  /api/libraries/mine/            — returns the authenticated user's libraries
"""
import time

from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from api.models.library import Library
from api.models.song import Song
from api.serializer import SongSerializer, LibrarySerializer, LibraryWithSongsSerializer
from api.services.suno_api import SunoAPIError, get_suno_service
from api.services.moderation_service import ModerationService

# 10-minute absolute timeout (seconds)
GENERATION_TIMEOUT = 600


# ── User Libraries ────────────────────────────────────────────────────────────

class UserLibrariesAPI(generics.GenericAPIView):
    """
    GET /api/libraries/mine/
    Returns all libraries owned by the authenticated user (with song count).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        libraries = Library.objects.filter(owner=request.user).order_by("name")
        return Response(LibraryWithSongsSerializer(libraries, many=True).data)


class LibraryDetailAPI(generics.GenericAPIView):
    """
    GET /api/libraries/<pk>/detail/
    Returns a single library with its full nested song list.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        library = Library.objects.filter(pk=pk, owner=request.user).first()
        if not library:
            return Response({"error": "Library not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(LibraryWithSongsSerializer(library).data)


# ── Generate ──────────────────────────────────────────────────────────────────

class GenerateSongAPI(generics.GenericAPIView):
    """
    POST /api/suno/generate/

    Body (non-custom mode — simplest):
        { "prompt": "A chill lo-fi beat" }

    Body (custom mode):
        {
          "prompt": "...",          # used as lyrics
          "custom_mode": true,
          "instrumental": false,
          "style": "Lo-Fi",
          "title": "Midnight Vibes",
          "model": "V4_5ALL",
          "negative_tags": "Heavy Metal",
          "vocal_gender": "f"
        }

    Response:
        { "task_id": "...", "started_at": <unix_timestamp> }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            raise ValidationError("prompt is required.")

        custom_mode = bool(request.data.get("custom_mode", False))
        instrumental = bool(request.data.get("instrumental", False))
        style = request.data.get("style", "")
        title = request.data.get("title", "")
        model = request.data.get("model", "V4_5ALL")
        negative_tags = request.data.get("negative_tags", "")
        vocal_gender = request.data.get("vocal_gender", "")
        use_mock = request.data.get("use_mock", None)
        strategy = request.data.get("strategy", None)

        if strategy is None and use_mock is not None:
            strategy = "mock" if use_mock else "suno"

        try:
            suno = get_suno_service(strategy)
            task_id = suno.generate_song(
                prompt=prompt,
                custom_mode=custom_mode,
                instrumental=instrumental,
                style=style,
                title=title,
                model=model,
                negative_tags=negative_tags,
                vocal_gender=vocal_gender,
            )
        except SunoAPIError as exc:
            raise ValidationError(str(exc))

        return Response(
            {
                "task_id": task_id,
                "started_at": int(time.time()),
            },
            status=status.HTTP_202_ACCEPTED,
        )


# ── Poll Status ───────────────────────────────────────────────────────────────

class SongStatusAPI(generics.GenericAPIView):
    """
    GET /api/suno/status/<task_id>/?started_at=<unix_ts>

    Polls Suno for the current task status. On SUCCESS, returns the raw
    song data from Suno WITHOUT saving to the database — the user must
    explicitly call /api/suno/save/ to save a song to a library.

    Possible responses:
      202  — still generating; includes current `status` string
      200  — SUCCESS; includes raw `songs` list from Suno
      408  — timeout: generation exceeded 10 minutes
      422  — generation failed on Suno's side
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        # Check timeout
        started_at_raw = request.query_params.get("started_at")
        if started_at_raw:
            try:
                started_at = int(started_at_raw)
                elapsed = int(time.time()) - started_at
                if elapsed > GENERATION_TIMEOUT:
                    return Response(
                        {
                            "error": "timeout",
                            "message": "Song generation exceeded the 10-minute limit and was rejected.",
                            "elapsed_seconds": elapsed,
                        },
                        status=status.HTTP_408_REQUEST_TIMEOUT,
                    )
            except (ValueError, TypeError):
                pass

        try:
            strategy = "mock" if task_id.startswith("mock-") else None
            suno = get_suno_service(strategy)
            task_data = suno.get_task_status(task_id)
        except SunoAPIError as exc:
            raise ValidationError(str(exc))

        current_status = task_data.get("status", "PENDING")

        # Still in progress
        if not suno.is_terminal(current_status):
            return Response(
                {"task_id": task_id, "status": current_status},
                status=status.HTTP_202_ACCEPTED,
            )

        # Failed on Suno's side
        if suno.is_failed(current_status):
            error_msg = task_data.get("errorMessage") or current_status
            return Response(
                {
                    "error": "generation_failed",
                    "message": f"Suno generation failed: {error_msg}",
                    "status": current_status,
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # SUCCESS — return raw Suno song data for user to review & choose library
        raw_songs = [
            {
                "title": s.get("title") or "Untitled AI Song",
                "audio_url": s.get("audioUrl", ""),
                "stream_audio_url": s.get("streamAudioUrl", ""),
                "thumbnail_url": s.get("imageUrl", ""),
                "lyrics": s.get("prompt", ""),
                "genre": s.get("tags", ""),
                "duration": s.get("duration"),
                "suno_id": s.get("id"),
            }
            for s in suno.extract_songs(task_data)
        ]

        return Response(
            {
                "task_id": task_id,
                "status": current_status,
                "songs": raw_songs,
            },
            status=status.HTTP_200_OK,
        )


# ── Save to Library ───────────────────────────────────────────────────────────

class SaveSongAPI(generics.GenericAPIView):
    """
    POST /api/suno/save/

    Called when the user confirms saving a generated song to a library.

    Body:
        {
          "library_id": 1,            # required; or "new" + "library_name"
          "library_name": "My Mix",   # used when creating a new library
          "title": "Neon Dreams",
          "audio_url": "https://...",
          "thumbnail_url": "https://...",
          "lyrics": "...",
          "genre": "lo-fi, chill"
        }

    Response:
        { "song": { ...SongSerializer } }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        audio_url = request.data.get("audio_url", "").strip()
        if not audio_url:
            raise ValidationError("audio_url is required.")

        library_id = request.data.get("library_id")
        library_name = request.data.get("library_name", "").strip()

        if library_id == "new":
            if not library_name:
                raise ValidationError("library_name is required when creating a new library.")
            library = Library.objects.create(
                owner=request.user,
                name=library_name,
                description="",
            )
        elif library_id:
            library = Library.objects.filter(
                id=library_id, owner=request.user
            ).first()
            if not library:
                raise ValidationError("Library not found or access denied.")
        else:
            # Fall back to default library
            library, _ = Library.objects.get_or_create(
                owner=request.user,
                name="Default Library",
                defaults={"description": "Auto-created library"},
            )

        song, _ = Song.objects.get_or_create(
            audio_url=audio_url,
            defaults={
                "title": request.data.get("title") or "Untitled AI Song",
                "lyrics": request.data.get("lyrics", ""),
                "genre": request.data.get("genre", ""),
                "thumbnail_url": request.data.get("thumbnail_url", ""),
                "library": library,
            },
        )

        # If song existed already (re-save to different library), move it
        if song.library != library:
            song.library = library
            song.save(update_fields=["library"])

        return Response(
            {"song": SongSerializer(song).data},
            status=status.HTTP_201_CREATED,
        )


# ── Lyrics Generation ────────────────────────────────────────────────────────

class GenerateLyricsAPI(generics.GenericAPIView):
    """
    POST /api/suno/lyrics/generate/
    Body: { "prompt": "A song about sunshine", "use_mock": false }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            raise ValidationError("prompt is required.")

        # Check for inappropriate content in prompt
        moderator = ModerationService()
        if not moderator.is_appropriate(prompt):
            raise ValidationError("Prompt contains inappropriate content.")

        use_mock = request.data.get("use_mock", None)
        strategy = request.data.get("strategy", None)

        if strategy is None and use_mock is not None:
            strategy = "mock" if use_mock else "suno"

        try:
            suno = get_suno_service(strategy)
            task_id = suno.generate_lyrics(prompt=prompt)
        except SunoAPIError as exc:
            raise ValidationError(str(exc))

        return Response(
            {
                "task_id": task_id,
                "started_at": int(time.time()),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class LyricsStatusAPI(generics.GenericAPIView):
    """
    GET /api/suno/lyrics/status/<task_id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        try:
            strategy = "mock" if task_id.startswith("mock-") else None
            suno = get_suno_service(strategy)
            task_data = suno.get_lyrics(task_id)
        except SunoAPIError as exc:
            raise ValidationError(str(exc))

        current_status = task_data.get("status", "PENDING")

        if current_status == "SUCCESS":
            lyrics_text = task_data.get("data", {}).get("text", "")
            
            # Optionally moderate the generated lyrics
            moderator = ModerationService()
            if lyrics_text and not moderator.is_appropriate(lyrics_text):
                return Response(
                    {
                        "error": "inappropriate_content",
                        "message": "Generated lyrics violate safety guidelines.",
                        "status": "FAILED",
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            return Response(
                {
                    "task_id": task_id,
                    "status": current_status,
                    "data": task_data.get("data", {}),
                },
                status=status.HTTP_200_OK,
            )

        if current_status in ["FAILED", "ERROR"]:
            return Response(
                {
                    "error": "generation_failed",
                    "message": task_data.get("errorMessage", "Lyrics generation failed."),
                    "status": current_status,
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(
            {"task_id": task_id, "status": current_status},
            status=status.HTTP_202_ACCEPTED,
        )
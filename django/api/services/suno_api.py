import requests
from django.conf import settings

SUNO_API_BASE = "https://api.sunoapi.org"
# Fallback callback URL for local dev — Suno requires it but won't reach localhost.
# In production set SUNO_CALLBACK_URL to your real public URL, e.g.
# https://yourapp.com/api/suno/callback/
DEFAULT_CALLBACK_URL = "https://example.com/api/suno/callback/"

TERMINAL_STATUSES = {
    "SUCCESS",
    "GENERATE_AUDIO_FAILED",
    "CREATE_TASK_FAILED",
    "SENSITIVE_WORD_ERROR",
    "CALLBACK_EXCEPTION",
}
SUCCESS_STATUS = "SUCCESS"
FAILURE_STATUSES = TERMINAL_STATUSES - {SUCCESS_STATUS}


class SunoAPIError(Exception):
    pass


class SunoTimeoutError(SunoAPIError):
    """Raised when a generation task exceeds the 10-minute limit."""
    pass


import abc
import time
import uuid

class SunoServiceStrategy(abc.ABC):
    @abc.abstractmethod
    def generate_song(
        self,
        prompt: str,
        custom_mode: bool = False,
        instrumental: bool = False,
        style: str = "",
        title: str = "",
        model: str = "V4_5ALL",
        negative_tags: str = "",
        vocal_gender: str = "",
        callback_url: str = "",
    ) -> str:
        pass

    @abc.abstractmethod
    def get_task_status(self, task_id: str) -> dict:
        pass

    @abc.abstractmethod
    def generate_lyrics(self, prompt: str) -> str:
        """Submit a task to generate lyrics. Returns task_id."""
        pass

    @abc.abstractmethod
    def get_lyrics(self, task_id: str) -> dict:
        """Fetch the generated lyrics for a given task."""
        pass

    def is_terminal(self, status: str) -> bool:
        return status in TERMINAL_STATUSES

    def is_success(self, status: str) -> bool:
        return status == SUCCESS_STATUS

    def is_failed(self, status: str) -> bool:
        return status in FAILURE_STATUSES

    def extract_songs(self, task_data: dict) -> list:
        return task_data.get("response", {}).get("sunoData", [])


MOCK_TASKS = {}

class MockSunoService(SunoServiceStrategy):
    """
    Mock service that simulates the Suno API locally, returning a local audio file.
    """
    def generate_song(
        self,
        prompt: str,
        custom_mode: bool = False,
        instrumental: bool = False,
        style: str = "",
        title: str = "",
        model: str = "V4_5ALL",
        negative_tags: str = "",
        vocal_gender: str = "",
        callback_url: str = "",
    ) -> str:
        task_id = f"mock-{uuid.uuid4().hex[:8]}"
        MOCK_TASKS[task_id] = {
            "created_at": time.time(),
            "prompt": prompt,
            "title": title if title else "Mock AI Song",
            "tags": style,
        }
        return task_id

    def get_task_status(self, task_id: str) -> dict:
        task = MOCK_TASKS.get(task_id)
        if not task:
            return {"status": "FAILED", "errorMessage": "Mock task not found"}
        
        elapsed = time.time() - task["created_at"]
        
        if elapsed < 2:
            status = "PENDING"
        elif elapsed < 4:
            status = "TEXT_SUCCESS"
        elif elapsed < 6:
            status = "FIRST_SUCCESS"
        else:
            status = "SUCCESS"
            
        if status == "SUCCESS":
            return {
                "status": status,
                "response": {
                    "sunoData": [
                        {
                            "id": f"suno-{task_id}-1",
                            "audioUrl": "http://localhost:8000/media/songs/D_狙えホームラン.mp3",
                            "streamAudioUrl": "http://localhost:8000/media/songs/D_狙えホームラン.mp3",
                            "imageUrl": "https://placehold.co/400x400/0f0f1a/8b5cf6?text=Mock+Song",
                            "title": task["title"],
                            "tags": task["tags"],
                            "prompt": task["prompt"],
                            "duration": 180.0
                        }
                    ]
                }
            }
        return {"status": status}

    def generate_lyrics(self, prompt: str) -> str:
        task_id = f"mock-lyrics-{uuid.uuid4().hex[:8]}"
        MOCK_TASKS[task_id] = {
            "created_at": time.time(),
            "prompt": prompt,
            "type": "lyrics"
        }
        return task_id

    def get_lyrics(self, task_id: str) -> dict:
        task = MOCK_TASKS.get(task_id)
        if not task:
            return {"status": "FAILED", "errorMessage": "Mock task not found"}
        
        elapsed = time.time() - task["created_at"]
        if elapsed < 2:
            return {"status": "PENDING"}
        
        return {
            "status": "SUCCESS",
            "data": {
                "text": "[Verse 1]\nThis is a mock generated lyric based on your prompt:\n" + task["prompt"] + "\n\n[Chorus]\nMocking bird singing in the dead of night,\nTake these broken wings and learn to fly.",
                "title": "Mock Generated Title"
            }
        }

class SunoService(SunoServiceStrategy):
    """
    Service class for interacting with the official Suno API (sunoapi.org).
    Docs: https://docs.sunoapi.org

    Base URL : https://api.sunoapi.org
    Auth     : Authorization: Bearer <SUNO_API_KEY>

    Key endpoints:
      POST /api/v1/generate          -> returns { data: { taskId } }
      GET  /api/v1/generate/record-info?taskId=<id>
                                     -> returns { data: { status, response: { sunoData: [...] } } }
    """

    def __init__(self):
        api_key = getattr(settings, "SUNO_API_KEY", "")
        if not api_key:
            raise SunoAPIError("SUNO_API_KEY is not configured in settings.")
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Generate
    # ------------------------------------------------------------------

    def generate_song(
        self,
        prompt: str,
        custom_mode: bool = False,
        instrumental: bool = False,
        style: str = "",
        title: str = "",
        model: str = "V4_5ALL",
        negative_tags: str = "",
        vocal_gender: str = "",
        callback_url: str = "",
    ) -> str:
        """
        Submit a generation request.
        Returns the taskId string on success.

        Non-custom mode (default): only ``prompt`` is required (max 500 chars).
        Custom mode: ``style`` and ``title`` are also required.
        """
        payload: dict = {
            "customMode": custom_mode,
            "instrumental": instrumental,
            "model": model,
            "prompt": prompt,
        }

        if custom_mode:
            if not style or not title:
                raise SunoAPIError("style and title are required when customMode is True.")
            payload["style"] = style
            payload["title"] = title

        if negative_tags:
            payload["negativeTags"] = negative_tags
        if vocal_gender:
            payload["vocalGender"] = vocal_gender

        # callBackUrl is required by Suno API. Use the configured public URL
        # (or a placeholder for local dev — Suno validates the field exists but
        # we still poll /record-info ourselves, so callback delivery is optional).
        resolved_callback = (
            callback_url
            or getattr(settings, "SUNO_CALLBACK_URL", "")
            or DEFAULT_CALLBACK_URL
        )
        payload["callBackUrl"] = resolved_callback

        try:
            response = requests.post(
                f"{SUNO_API_BASE}/api/v1/generate",
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            raise SunoAPIError(f"Failed to submit generation request: {exc}") from exc

        result = response.json()
        if result.get("code") != 200:
            raise SunoAPIError(f"Suno API error: {result.get('msg', 'Unknown error')}")

        task_id = result.get("data", {}).get("taskId")
        if not task_id:
            raise SunoAPIError("Suno API did not return a taskId.")

        return task_id

    # ------------------------------------------------------------------
    # Poll
    # ------------------------------------------------------------------

    def get_task_status(self, task_id: str) -> dict:
        """
        Fetch the latest status of a generation task.
        Returns the full ``data`` dict from the API response.

        Important fields:
          status           : PENDING | TEXT_SUCCESS | FIRST_SUCCESS | SUCCESS | *_FAILED
          response.sunoData: list of completed song objects (only when status == SUCCESS)
            Each song has: id, audioUrl, streamAudioUrl, imageUrl, title, tags, prompt, duration
        """
        try:
            response = requests.get(
                f"{SUNO_API_BASE}/api/v1/generate/record-info",
                headers=self.headers,
                params={"taskId": task_id},
                timeout=30,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            raise SunoAPIError(f"Failed to fetch task status: {exc}") from exc

        result = response.json()
        if result.get("code") != 200:
            raise SunoAPIError(f"Suno API error: {result.get('msg', 'Unknown error')}")

        return result.get("data", {})

    # ------------------------------------------------------------------
    # Lyrics
    # ------------------------------------------------------------------

    def generate_lyrics(self, prompt: str) -> str:
        """
        Submit a request to generate lyrics.
        Assumes the endpoint is /api/v1/lyrics/generate
        """
        payload = {"prompt": prompt}
        try:
            response = requests.post(
                f"{SUNO_API_BASE}/api/v1/lyrics/generate",
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            raise SunoAPIError(f"Failed to submit lyrics request: {exc}") from exc

        result = response.json()
        if result.get("code") != 200:
            raise SunoAPIError(f"Suno API error: {result.get('msg', 'Unknown error')}")

        task_id = result.get("data", {}).get("taskId")
        if not task_id:
            # Some wrappers return ID directly
            task_id = result.get("data", {}).get("id")
            if not task_id:
                raise SunoAPIError("Suno API did not return a taskId for lyrics.")

        return task_id

    def get_lyrics(self, task_id: str) -> dict:
        """
        Fetch generated lyrics.
        Assumes the endpoint is /api/v1/lyrics/record-info
        """
        try:
            response = requests.get(
                f"{SUNO_API_BASE}/api/v1/lyrics/record-info",
                headers=self.headers,
                params={"taskId": task_id},
                timeout=30,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            raise SunoAPIError(f"Failed to fetch lyrics status: {exc}") from exc

        result = response.json()
        if result.get("code") != 200:
            raise SunoAPIError(f"Suno API error: {result.get('msg', 'Unknown error')}")

        return result.get("data", {})


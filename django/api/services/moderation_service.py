import requests
from django.conf import settings

class ContentModerationError(Exception):
    pass

class ModerationService:
    """
    Service for checking whether text (e.g., generated lyrics or prompts) 
    contains inappropriate content using OpenAI's Moderation API.
    This API is free to use if you have an OpenAI account.
    """
    
    def __init__(self):
        self.api_key = getattr(settings, "OPENAI_API_KEY", "")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        self.url = "https://api.openai.com/v1/moderations"

    def is_appropriate(self, text: str) -> bool:
        """
        Returns True if the text is appropriate, False if it violates OpenAI's moderation policies.
        Requires an OpenAI API key in Django settings (OPENAI_API_KEY).
        """
        if not self.api_key:
            # If no API key is provided, we default to True to not block development,
            # but ideally you should set OPENAI_API_KEY in settings.py
            print("WARNING: OPENAI_API_KEY not set. Moderation check skipped.")
            return True

        if not text or not text.strip():
            return True

        payload = {"input": text}
        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise ContentModerationError(f"Failed to call OpenAI moderation API: {e}")

        data = response.json()
        results = data.get("results", [])
        if not results:
            return True
            
        # 'flagged' is True if the model classifies the text as violating OpenAI's usage policies
        is_flagged = results[0].get("flagged", False)
        return not is_flagged

    def get_moderation_details(self, text: str) -> dict:
        """
        Returns the full moderation analysis from OpenAI, which includes
        categories (hate, self-harm, sexual, etc.) and category_scores.
        """
        if not self.api_key:
            return {"flagged": False, "categories": {}, "category_scores": {}}
            
        if not text or not text.strip():
            return {"flagged": False, "categories": {}, "category_scores": {}}
            
        payload = {"input": text}
        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise ContentModerationError(f"Failed to call OpenAI moderation API: {e}")

        data = response.json()
        results = data.get("results", [])
        if results:
            return results[0]
        return {"flagged": False, "categories": {}, "category_scores": {}}

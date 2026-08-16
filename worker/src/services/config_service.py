import time
from typing import Dict, Any
from google.cloud import firestore
from src.core.config import settings

class DynamicConfigService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DynamicConfigService, cls).__new__(cls)
            cls._instance.db = None
            cls._instance.cache = {}
            cls._instance.last_fetch = 0
            cls._instance.cache_ttl = 60 # 60 seconds
        return cls._instance

    def _refresh_if_needed(self):
        now = time.time()
        if now - self.last_fetch > self.cache_ttl:
            try:
                if self.db is None:
                    self.db = firestore.Client(project=settings.GOOGLE_CLOUD_PROJECT)
                doc = self.db.collection('settings').document('system').get()
                if doc.exists:
                    self.cache = doc.to_dict()
                else:
                    self.cache = {}
                self.last_fetch = now
            except Exception as e:
                print(f"Error fetching dynamic config: {e}")
                # Keep stale cache on error

    def get(self, key: str, default: Any = None) -> Any:
        self._refresh_if_needed()
        return self.cache.get(key, default)

config_service = DynamicConfigService()

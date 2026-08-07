from google.cloud import storage
from src.core.config import settings

def get_storage_client() -> storage.Client:
    return storage.Client(project=settings.GOOGLE_CLOUD_PROJECT)

class StorageService:
    def __init__(self, client: storage.Client = None):
        self.client = client or get_storage_client()
        self.bucket_name = settings.RAW_BUCKET_NAME

    def generate_upload_url(self, file_path: str, content_type: str, expiration_minutes: int = 15) -> str:
        from datetime import timedelta
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(file_path)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="PUT",
            content_type=content_type,
        )

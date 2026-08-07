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
        import google.auth
        from google.auth.transport import requests
        
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(file_path)
        
        credentials, _ = google.auth.default()
        credentials.refresh(requests.Request())
        
        sa_email = getattr(credentials, 'service_account_email', f"etl-backend-sa@{settings.GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com")
        
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="PUT",
            content_type=content_type,
            service_account_email=sa_email,
            access_token=credentials.token
        )

from google.cloud import storage
from datetime import timedelta
from src.core.config import settings

def get_storage_client() -> storage.Client:
    return storage.Client(project=settings.GOOGLE_CLOUD_PROJECT)

class StorageService:
    def __init__(self, client: storage.Client = None):
        self.client = client or get_storage_client()

    def download_file_bytes(self, bucket_name: str, file_path: str) -> bytes:
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        return blob.download_as_bytes()

    def upload_file_bytes(self, bucket_name: str, file_path: str, data: bytes, content_type: str) -> str:
        import google.auth
        from google.auth.transport import requests
        
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        blob.upload_from_string(data, content_type=content_type)
        
        credentials, _ = google.auth.default()
        credentials.refresh(requests.Request())
        sa_email = getattr(credentials, 'service_account_email', f"etl-backend-sa@{settings.GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com")

        return blob.generate_signed_url(
            version="v4", 
            expiration=timedelta(days=7), 
            method="GET",
            service_account_email=sa_email,
            access_token=credentials.token
        )

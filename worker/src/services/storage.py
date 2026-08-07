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
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        blob.upload_from_string(data, content_type=content_type)
        return blob.generate_signed_url(version="v4", expiration=timedelta(days=7), method="GET")

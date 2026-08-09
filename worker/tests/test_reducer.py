import pytest
import json
import pandas as pd
from unittest.mock import MagicMock
from src.services.reducer import ReducerService

class MockBlob:
    def __init__(self, data: list):
        self._data = json.dumps(data).encode('utf-8')
        self.name = "test.json"
        
    def download_as_bytes(self) -> bytes:
        return self._data

class MockBucket:
    def __init__(self, blobs):
        self.blobs = blobs
    def list_blobs(self, prefix=None):
        return self.blobs

class MockClient:
    def __init__(self, blobs):
        self.bucket_mock = MockBucket(blobs)
    def bucket(self, name):
        return self.bucket_mock

class MockStorageService:
    def __init__(self, blobs_data: list):
        self.blobs = [MockBlob(d) for d in blobs_data]
        self.client = MockClient(self.blobs)
        self.upload_called_with = None
        
    def upload_file_bytes(self, bucket: str, path: str, data: bytes, content_type: str) -> str:
        self.upload_called_with = (bucket, path, data, content_type)
        return f"https://storage.googleapis.com/{bucket}/{path}"

class MockFirestoreService:
    def __init__(self):
        self.db = MagicMock()
        self.status_updates = {}
        
    def update_job_status(self, job_id: str, status: str, updates: dict = None):
        self.status_updates[job_id] = {"status": status}
        if updates:
            self.status_updates[job_id].update(updates)
            
    def get_job(self, job_id: str):
        return {"email": "test@example.com"}

def test_reduce_job_success():
    storage_svc = MockStorageService([
        [{"id": 1, "name": "Alice"}],
        [{"id": 2, "name": "Bob"}]
    ])
    firestore_svc = MockFirestoreService()
    
    reducer = ReducerService(storage_svc, firestore_svc)
    reducer.reduce_job("job-123")
    
    # Assert upload was called
    assert storage_svc.upload_called_with is not None
    bucket, path, data, content_type = storage_svc.upload_called_with
    assert path.startswith("outputs/Structurify_data_")
    assert path.endswith(".xlsx")
    assert content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    # Assert firestore was updated
    status_update = firestore_svc.status_updates.get("job-123")
    assert status_update is not None
    assert status_update["status"] == "completed"
    assert "download_url" in status_update

def test_reduce_job_empty_chunks():
    # Simulate the rate limit failure scenario where chunks are empty
    storage_svc = MockStorageService([
        [],
        []
    ])
    firestore_svc = MockFirestoreService()
    
    reducer = ReducerService(storage_svc, firestore_svc)
    
    # It should raise an exception, caught by the reducer, and update the status to failed
    # Wait, does ReducerService catch its own exceptions?
    # Let's check how reduce_job is implemented. It catches Exception and updates firestore.
    
    # Actually, reduce_job wraps everything in try...except
    reducer.reduce_job("job-empty")
    
    status_update = firestore_svc.status_updates.get("job-empty")
    assert status_update is not None
    assert status_update["status"] == "failed"
    assert "No valid data extracted" in status_update["error_message"]

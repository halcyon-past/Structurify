import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock

from src.main import app
from src.api.dependencies import get_storage_service, get_pubsub_service, get_firestore_service

# Mock Services
class MockStorageService:
    def generate_upload_url(self, file_path: str, content_type: str, expiration_minutes: int = 15) -> str:
        return f"https://mock-storage.com/{file_path}"

class MockPubSubService:
    def publish_job(self, job_id: str, file_path: str, target_schema: dict):
        pass # mock success

class MockFirestoreService:
    def __init__(self):
        self.jobs = {}

    def create_job(self, job_id: str, file_path: str, file_name: str, target_schema: dict, created_at: str):
        self.jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "created_at": created_at
        }

    def update_job_status(self, job_id: str, status: str, error_message: str = None, updated_at: str = None):
        if job_id in self.jobs:
            self.jobs[job_id]["status"] = status
            if error_message:
                self.jobs[job_id]["error_message"] = error_message

    def get_job(self, job_id: str) -> dict:
        return self.jobs.get(job_id)

@pytest.fixture
def mock_storage():
    return MockStorageService()

@pytest.fixture
def mock_pubsub():
    return MockPubSubService()

@pytest.fixture
def mock_firestore():
    return MockFirestoreService()

@pytest.fixture
def client(mock_storage, mock_pubsub, mock_firestore):
    app.dependency_overrides[get_storage_service] = lambda: mock_storage
    app.dependency_overrides[get_pubsub_service] = lambda: mock_pubsub
    app.dependency_overrides[get_firestore_service] = lambda: mock_firestore
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

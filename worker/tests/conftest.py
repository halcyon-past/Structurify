import pytest
import pandas as pd
from src.services.storage import StorageService
from src.services.firestore import FirestoreService
from src.services.llm_engine import LLMEngine
from src.services.file_parser import FileParserService

class MockStorageService:
    def download_file_bytes(self, bucket_name: str, file_path: str) -> bytes:
        import os
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        if file_path == "uploads/dirty_data.csv":
            with open(os.path.join(base_dir, "data/dirty_data.csv"), "rb") as f:
                return f.read()
        elif file_path == "uploads/empty.csv":
            with open(os.path.join(base_dir, "data/empty.csv"), "rb") as f:
                return f.read()
                
        df = pd.DataFrame({"Name": ["John"], "Age": ["25"]})
        return df.to_csv(index=False).encode("utf-8")

    def upload_file_bytes(self, bucket_name: str, file_path: str, data: bytes, content_type: str) -> str:
        return f"https://mock-download-url/{file_path}"

class MockFirestoreService:
    def __init__(self):
        self.statuses = {}

    def update_job_status(self, job_id: str, status: str, updates: dict = None):
        self.statuses[job_id] = {"status": status}
        if updates:
            self.statuses[job_id].update(updates)

class MockLLMEngine:
    def call_gemini_api(self, chunk_data: str, target_schema: dict) -> list:
        return [{"name": "John Doe", "age": 25}]

@pytest.fixture
def file_parser():
    return FileParserService(
        storage_svc=MockStorageService(),
        firestore_svc=MockFirestoreService(),
        llm_engine=MockLLMEngine()
    )

from typing import Dict, Any
from datetime import datetime
from google.cloud import firestore
from src.core.config import settings

def get_firestore_client() -> firestore.Client:
    return firestore.Client(project=settings.GOOGLE_CLOUD_PROJECT)

class FirestoreService:
    def __init__(self, client: firestore.Client = None):
        self.db = client or get_firestore_client()

    def update_job_status(self, job_id: str, status: str, updates: Dict[str, Any] = None):
        job_ref = self.db.collection("jobs").document(job_id)
        data = {"status": status, "updated_at": datetime.utcnow().isoformat()}
        if updates:
            data.update(updates)
        job_ref.update(data)

    def get_job(self, job_id: str) -> Dict[str, Any]:
        job_ref = self.db.collection("jobs").document(job_id)
        doc = job_ref.get()
        return doc.to_dict() if doc.exists else None

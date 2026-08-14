from google.cloud import firestore
from src.core.config import settings

def get_firestore_client() -> firestore.Client:
    return firestore.Client(project=settings.GOOGLE_CLOUD_PROJECT)

class FirestoreService:
    def __init__(self, client: firestore.Client = None):
        self.db = client or get_firestore_client()

    def create_job(self, job_id: str, file_path: str, file_name: str, target_schema: dict, created_at: str, email: str = None, role: str = "guest", plan: str = "free", user_id: str = None, ip_address: str = None):
        job_ref = self.db.collection("jobs").document(job_id)
        job_data = {
            "job_id": job_id,
            "file_path": file_path,
            "file_name": file_name,
            "target_schema": target_schema,
            "status": "queued",
            "created_at": created_at,
            "updated_at": created_at,
            "role": role,
            "plan": plan,
            "user_id": user_id,
            "ip_address": ip_address
        }
        if email:
            job_data["email"] = email
        job_ref.set(job_data)

    def update_job_status(self, job_id: str, status: str, error_message: str = None, updated_at: str = None):
        job_ref = self.db.collection("jobs").document(job_id)
        updates = {"status": status, "updated_at": updated_at}
        if error_message:
            updates["error_message"] = error_message
        job_ref.update(updates)

    def get_job(self, job_id: str) -> dict:
        job_ref = self.db.collection("jobs").document(job_id)
        doc = job_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    def cancel_job(self, job_id: str) -> None:
        """
        Forcefully cancels a job, updating both the operational table and the audit logger.
        """
        import datetime
        now = datetime.datetime.utcnow().isoformat()
        cancel_data = {
            "status": "cancelled",
            "error_message": "Job was manually cancelled by the user.",
            "updated_at": now
        }
        
        # Update jobs collection
        job_ref = self.db.collection("jobs").document(job_id)
        if job_ref.get().exists:
            job_ref.update(cancel_data)
            
        # Update job_audits collection
        audit_ref = self.db.collection("job_audits").document(job_id)
        if audit_ref.get().exists:
            audit_ref.update({
                "status": "cancelled",
                "error_message": "Job was manually cancelled by the user.",
                "completed_at": now
            })

from typing import Dict, Any
from datetime import datetime
from google.cloud import firestore

class AuditService:
    def __init__(self, db: firestore.Client):
        self.db = db

    def log_job_completion(self, job_data: Dict[str, Any], stats: Dict[str, Any], semantic_meta: Dict[str, Any]):
        """
        Logs detailed telemetry and metadata about a completed job for dashboarding purposes.
        """
        job_id = job_data.get("job_id", "unknown")
        
        audit_payload = {
            "job_id": job_id,
            "user_id": job_data.get("user_id"),
            "email": job_data.get("email"),
            "role": job_data.get("role", "guest"),
            "plan": job_data.get("plan", "free"),
            "file_name": job_data.get("file_name"),
            "processed_rows": job_data.get("processed_rows", 0),
            "target_schema": job_data.get("target_schema", {}),
            "completed_at": datetime.utcnow().isoformat(),
            "created_at": job_data.get("created_at"),
            "status": "completed",
            
            # Analytics Data
            "column_stats": stats,
            "semantic_metadata": semantic_meta
        }
        
        # Write to the job_audits collection
        self.db.collection("job_audits").document(job_id).set(audit_payload)

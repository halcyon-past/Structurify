from typing import Dict, Any
from datetime import datetime
from google.cloud import firestore

import os

class AuditService:
    def __init__(self, db: firestore.Client):
        self.db = db

    def log_job_start(self, job_data: Dict[str, Any]):
        """
        Logs the start of a job to the job_audits collection to track active jobs.
        """
        job_id = job_data.get("job_id")
        if not job_id:
            return

        audit_payload = {
            "job_id": job_id,
            "user_id": job_data.get("user_id"),
            "email": job_data.get("email"),
            "role": job_data.get("role", "guest"),
            "plan": job_data.get("plan", "free"),
            "file_name": job_data.get("file_name"),
            "target_schema": job_data.get("target_schema", {}),
            "created_at": job_data.get("created_at"),
            "status": "processing",
            
            # Infrastructure Tracing
            "cloud_run_revision": os.environ.get("K_REVISION", "unknown")
        }
        
        self.db.collection("job_audits").document(job_id).set(audit_payload)

    def log_job_completion(self, job_data: Dict[str, Any], stats: Dict[str, Any], semantic_meta: Dict[str, Any], download_url: str):
        """
        Updates an existing active job with detailed telemetry and metadata.
        """
        job_id = job_data.get("job_id", "unknown")
        
        audit_payload = {
            "processed_rows": job_data.get("processed_rows", 0),
            "completed_at": datetime.utcnow().isoformat(),
            "status": "completed",
            "download_url": download_url,
            
            # Analytics Data
            "column_stats": stats,
            "semantic_metadata": semantic_meta
        }
        
        # Write to the job_audits collection
        self.db.collection("job_audits").document(job_id).update(audit_payload)

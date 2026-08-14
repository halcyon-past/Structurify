from typing import Dict, Any
from datetime import datetime
from google.cloud import firestore

import os

class AuditService:
    def __init__(self, db: firestore.Client):
        self.db = db

    def log_job_start(self, job_data: Dict[str, Any], file_size_mb: float = 0.0, total_chunks: int = 0):
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
            "ip_address": job_data.get("ip_address"),
            "file_name": job_data.get("file_name"),
            "file_size_mb": file_size_mb,
            "total_chunks": total_chunks,
            "target_schema": job_data.get("target_schema", {}),
            "created_at": job_data.get("created_at"),
            "started_at": datetime.utcnow().isoformat(),
            "status": "processing",
            
            # Infrastructure Tracing
            "cloud_run_revision": os.environ.get("K_REVISION", "unknown")
        }
        
        self.db.collection("job_audits").document(job_id).set(audit_payload)

    def log_job_failure(self, job_id: str, error_message: str):
        """
        Updates an existing active job to failed state with the error message.
        """
        if not job_id or job_id == "unknown":
            return
            
        audit_payload = {
            "status": "failed",
            "error_message": error_message,
            "completed_at": datetime.utcnow().isoformat()
        }
        
        # Write to the job_audits collection
        self.db.collection("job_audits").document(job_id).update(audit_payload)

    def log_job_completion(self, job_data: Dict[str, Any], stats: Dict[str, Any], semantic_meta: Dict[str, Any], download_url: str, total_tokens: int = 0):
        """
        Updates an existing active job with detailed telemetry and metadata.
        """
        job_id = job_data.get("job_id", "unknown")
        
        completed_at_iso = datetime.utcnow().isoformat()
        job_runtime_seconds = 0.0
        
        # Calculate Job Runtime (Execution time minus queue time)
        started_at = job_data.get("started_at")
        if started_at:
            try:
                # Handle standard ISO format from Python datetime
                start_dt = datetime.fromisoformat(started_at)
                end_dt = datetime.fromisoformat(completed_at_iso)
                job_runtime_seconds = (end_dt - start_dt).total_seconds()
            except Exception as e:
                print(f"Failed to calculate job runtime for {job_id}: {e}")
        
        audit_payload = {
            "processed_rows": job_data.get("processed_rows", 0),
            "completed_at": completed_at_iso,
            "job_runtime_seconds": job_runtime_seconds,
            "status": "completed",
            "download_url": download_url,
            "total_tokens": total_tokens,
            
            # Analytics Data
            "column_stats": stats,
            "semantic_metadata": semantic_meta
        }
        
        # Write to the job_audits collection
        self.db.collection("job_audits").document(job_id).update(audit_payload)

import io
import time
import traceback
import json
from typing import Dict, Any
import pandas as pd
from google.cloud import pubsub_v1

from src.core.config import settings
from src.services.storage import StorageService
from src.services.firestore import FirestoreService
from src.services.email_service import EmailService
from src.services.audit import AuditService
from src.services.config_service import config_service

class FileParserService:
    def __init__(self, storage_svc: StorageService, firestore_svc: FirestoreService, email_svc: EmailService, audit_svc: AuditService = None):
        self.storage_svc = storage_svc
        self.firestore_svc = firestore_svc
        self.email_svc = email_svc
        self.audit_svc = audit_svc
        self.publisher = pubsub_v1.PublisherClient()
        self.topic_path = self.publisher.topic_path(settings.GOOGLE_CLOUD_PROJECT, "chunk-processing-jobs")

    def process_file(self, job_id: str, file_path: str, target_schema: Dict[str, Any], email: str = None):
        self.firestore_svc.update_job_status(job_id, "processing")
        
        try:
            file_bytes = self.storage_svc.download_file_bytes(settings.RAW_BUCKET_NAME, file_path)
            file_size_mb = len(file_bytes) / (1024 * 1024)

            if file_size_mb > 1.0 and email:
                tracking_url = f"{settings.FRONTEND_URL}/track?jobId={job_id}"
                self.email_svc.send_started_email(email, tracking_url)
            
            # Dynamically calculate chunk size based on target schema.
            # With gemini-3.6-flash (65K output token limit), we can safely process 500 rows per chunk.
            # Fewer chunks = fewer Pub/Sub push deliveries = no push window throttling.
            num_fields = len(target_schema.keys()) if target_schema else 1
            max_chunk_size = config_service.get('max_rows_per_chunk', 500)
            target_cells = config_service.get('target_cells_per_chunk', 5000)
            chunk_size = max(250, min(max_chunk_size, target_cells // num_fields))
            chunks = []
            
            if file_path.lower().endswith(".csv"):
                for chunk_df in pd.read_csv(io.BytesIO(file_bytes), on_bad_lines='skip', chunksize=chunk_size):
                    chunks.append(chunk_df.to_csv(index=False))
            elif file_path.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(file_bytes))
                total_rows = len(df)
                for start_idx in range(0, total_rows, chunk_size):
                    end_idx = min(start_idx + chunk_size, total_rows)
                    chunks.append(df.iloc[start_idx:end_idx].to_csv(index=False))
            else:
                raise ValueError("Unsupported file format. Must be CSV or XLSX.")
                
            total_chunks = len(chunks)
            
            # Log job start to audit table
            if self.audit_svc:
                job_data = self.firestore_svc.get_job(job_id)
                if job_data:
                    try:
                        self.audit_svc.log_job_start(job_data, file_size_mb, total_chunks)
                    except Exception as e:
                        print(f"Failed to log job start: {e}")
            
            # Setup tracker in Firestore
            self.firestore_svc.db.collection("jobs").document(job_id).update({
                "total_chunks": total_chunks,
                "completed_chunks": 0,
                "status": "processing_chunks"
            })
            
            futures = []
            for i, chunk_csv in enumerate(chunks):
                message = {
                    "job_id": job_id,
                    "chunk_id": str(i),
                    "chunk_data": chunk_csv,
                    "target_schema": target_schema
                }
                data = json.dumps(message).encode("utf-8")
                future = self.publisher.publish(self.topic_path, data=data)
                futures.append(future)
                
            # Await all publishes before returning to prevent Cloud Run from freezing the background thread
            for future in futures:
                future.result()
                
            print(f"Job {job_id}: Fanned out {total_chunks} chunks.")

        except Exception as e:
            error_message = str(e)
            stack_trace = traceback.format_exc()
            self.firestore_svc.update_job_status(job_id, "failed", {
                "error_message": error_message,
                "stack_trace": stack_trace
            })
            if self.audit_svc:
                try:
                    self.audit_svc.log_job_failure(job_id, error_message)
                except Exception as audit_e:
                    print(f"Failed to write audit failure log: {audit_e}")
            print(f"Job {job_id} failed: {stack_trace}")
            raise e

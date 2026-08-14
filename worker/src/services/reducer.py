import io
import json
import os
import shutil
import re
from datetime import datetime
import duckdb
from src.core.config import settings
from src.services.storage import StorageService
from src.services.firestore import FirestoreService

class ReducerService:
    def __init__(self, storage_svc: StorageService, firestore_svc: FirestoreService):
        self.storage_svc = storage_svc
        self.firestore_svc = firestore_svc

    def reduce_job(self, job_id: str):
        bucket = self.storage_svc.client.bucket(settings.RAW_BUCKET_NAME)
        blobs = bucket.list_blobs(prefix=f"jobs/{job_id}/results/")
        
        tmp_dir = f"/tmp/{job_id}"
        os.makedirs(tmp_dir, exist_ok=True)
        
        has_data = False
        for blob in blobs:
            if blob.name.endswith('.json'):
                local_path = os.path.join(tmp_dir, os.path.basename(blob.name))
                blob.download_to_filename(local_path)
                has_data = True
                    
        if not has_data:
            self.firestore_svc.update_job_status(job_id, "failed", {"error_message": "No valid data extracted from any chunks."})
            if os.path.exists(tmp_dir):
                shutil.rmtree(tmp_dir)
            return

        job_data = self.firestore_svc.get_job(job_id) or {}
        original_name = job_data.get("file_name", "data").rsplit('.', 1)[0]
        
        # Clean the original name to ensure it's safe for a URL/filename
        safe_original_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', original_name)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        output_file_name = f"outputs/Structurify_{safe_original_name}_{timestamp}.csv"
        local_csv = os.path.join(tmp_dir, "output.csv")
        
        try:
            # Use DuckDB to stream all JSON files into a single CSV efficiently
            # read_json_auto with format='array' parses the list of JSON objects
            duckdb.sql(f"COPY (SELECT * FROM read_json_auto('{tmp_dir}/*.json')) TO '{local_csv}' (HEADER, DELIMITER ',')")
            
            # Get the total processed rows
            processed_rows = duckdb.sql(f"SELECT count(*) FROM '{local_csv}'").fetchone()[0]
            
            if processed_rows == 0:
                self.firestore_svc.update_job_status(job_id, "failed", {"error_message": "No valid data extracted from any chunks."})
                return
            
            with open(local_csv, 'rb') as f:
                csv_bytes = f.read()
                
            download_url = self.storage_svc.upload_file_bytes(
                settings.PROCESSED_BUCKET_NAME,
                output_file_name,
                csv_bytes,
                content_type="text/csv"
            )
            
            self.firestore_svc.update_job_status(job_id, "completed", {
                "download_url": download_url,
                "processed_rows": processed_rows
            })
        except Exception as e:
            print(f"DuckDB aggregation failed: {e}")
            self.firestore_svc.update_job_status(job_id, "failed", {"error_message": f"DuckDB aggregation failed: {e}"})
            return
        finally:
            if os.path.exists(tmp_dir):
                shutil.rmtree(tmp_dir)

        # Send Email Notification if requested
        if job_data.get("email"):
            try:
                from src.services.email_service import EmailService
                email_svc = EmailService()
                email_svc.send_success_email(job_data["email"], download_url)
            except Exception as e:
                print(f"Failed to initialize or send email: {e}")

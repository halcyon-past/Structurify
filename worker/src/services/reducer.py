import io
import json
import pandas as pd
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
        
        all_data = []
        for blob in blobs:
            if blob.name.endswith('.json'):
                data_bytes = blob.download_as_bytes()
                try:
                    chunk_result = json.loads(data_bytes)
                    all_data.extend(chunk_result)
                except Exception as e:
                    print(f"Failed to parse chunk {blob.name}: {e}")
                    
        if not all_data:
            self.firestore_svc.update_job_status(job_id, "failed", {"error_message": "No valid data extracted from any chunks."})
            return

        df = pd.DataFrame(all_data)
        output_buffer = io.BytesIO()
        
        if len(df) > 1000000:
            df.to_csv(output_buffer, index=False)
            content_type = "text/csv"
            output_file_name = f"outputs/processed_{job_id}.csv"
        else:
            df.to_excel(output_buffer, index=False, engine='openpyxl')
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            output_file_name = f"outputs/processed_{job_id}.xlsx"
            
        output_buffer.seek(0)
        
        download_url = self.storage_svc.upload_file_bytes(
            settings.PROCESSED_BUCKET_NAME,
            output_file_name,
            output_buffer.getvalue(),
            content_type=content_type
        )
        
        self.firestore_svc.update_job_status(job_id, "completed", {
            "download_url": download_url,
            "processed_rows": len(df)
        })

        # Send Email Notification if requested
        job_data = self.firestore_svc.get_job(job_id)
        if job_data and job_data.get("email"):
            try:
                from src.services.email_service import EmailService
                email_svc = EmailService()
                email_svc.send_success_email(job_data["email"], download_url)
            except Exception as e:
                print(f"Failed to initialize or send email: {e}")

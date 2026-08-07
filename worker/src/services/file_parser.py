import io
import time
import traceback
from typing import Dict, Any
import pandas as pd

from src.core.config import settings
from src.services.storage import StorageService
from src.services.firestore import FirestoreService
from src.services.llm_engine import LLMEngine

class FileParserService:
    def __init__(self, storage_svc: StorageService, firestore_svc: FirestoreService, llm_engine: LLMEngine):
        self.storage_svc = storage_svc
        self.firestore_svc = firestore_svc
        self.llm_engine = llm_engine

    def process_file(self, job_id: str, file_path: str, target_schema: Dict[str, Any]):
        start_time = time.time()
        self.firestore_svc.update_job_status(job_id, "processing")
        
        try:
            # 1. Download file from GCS
            file_bytes = self.storage_svc.download_file_bytes(settings.RAW_BUCKET_NAME, file_path)
            
            # 2. Parse File
            if file_path.lower().endswith(".csv"):
                df = pd.read_csv(io.BytesIO(file_bytes), on_bad_lines='skip')
            elif file_path.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(file_bytes))
            else:
                raise ValueError("Unsupported file format. Must be CSV or XLSX.")
                
            total_rows = len(df)
            
            # 3. Chunk and Transform Data
            chunk_size = 50
            all_processed_data = []
            
            for start_idx in range(0, total_rows, chunk_size):
                end_idx = min(start_idx + chunk_size, total_rows)
                chunk_df = df.iloc[start_idx:end_idx]
                chunk_csv = chunk_df.to_csv(index=False)
                processed_chunk = self.llm_engine.call_gemini_api(chunk_csv, target_schema)
                all_processed_data.extend(processed_chunk)
                
            # 4. Compile to Excel
            processed_df = pd.DataFrame(all_processed_data)
            output_buffer = io.BytesIO()
            processed_df.to_excel(output_buffer, index=False, engine='openpyxl')
            output_buffer.seek(0)
            
            # 5. Upload to Processed Bucket
            output_file_name = f"outputs/processed_{job_id}.xlsx"
            download_url = self.storage_svc.upload_file_bytes(
                settings.PROCESSED_BUCKET_NAME,
                output_file_name,
                output_buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            
            duration = time.time() - start_time
            
            # 6. Update status to completed
            self.firestore_svc.update_job_status(job_id, "completed", {
                "download_url": download_url,
                "processed_rows": total_rows,
                "duration_seconds": round(duration, 2)
            })

        except Exception as e:
            error_message = str(e)
            stack_trace = traceback.format_exc()
            self.firestore_svc.update_job_status(job_id, "failed", {
                "error_message": error_message,
                "stack_trace": stack_trace
            })
            print(f"Job {job_id} failed: {stack_trace}")
            raise e

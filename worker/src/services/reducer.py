import io
import json
import os
import shutil
import re
import csv
import zipfile
from datetime import datetime
import duckdb
from src.core.config import settings
from src.services.storage import StorageService
from src.services.firestore import FirestoreService
from src.services.llm_engine import LLMEngine

class ReducerService:
    def __init__(self, storage_svc: StorageService, firestore_svc: FirestoreService, llm_engine: LLMEngine = None):
        self.storage_svc = storage_svc
        self.firestore_svc = firestore_svc
        self.llm_engine = llm_engine

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
        
        output_file_name = f"outputs/Structurify_{safe_original_name}_{timestamp}.zip"
        local_csv = os.path.join(tmp_dir, "data.csv")
        local_metadata_csv = os.path.join(tmp_dir, "metadata.csv")
        local_zip = os.path.join(tmp_dir, "output.zip")
        
        try:
            # Use DuckDB to stream all JSON files into a single CSV efficiently
            duckdb.sql(f"COPY (SELECT * FROM read_json_auto('{tmp_dir}/*.json')) TO '{local_csv}' (HEADER, DELIMITER ',')")
            
            # Get the total processed rows
            processed_rows = duckdb.sql(f"SELECT count(*) FROM '{local_csv}'").fetchone()[0]
            
            if processed_rows == 0:
                self.firestore_svc.update_job_status(job_id, "failed", {"error_message": "No valid data extracted from any chunks."})
                return
            
            # Generate Metadata Stats efficiently in a single pass
            columns = duckdb.sql(f"DESCRIBE SELECT * FROM '{local_csv}'").fetchall()
            col_names = [col[0] for col in columns]
            
            # Build optimized query to get all stats in one pass
            select_exprs = []
            for col in col_names:
                select_exprs.append(f"COUNT(\"{col}\")")
                select_exprs.append(f"approx_count_distinct(\"{col}\")")
            
            query = f"SELECT {', '.join(select_exprs)} FROM '{local_csv}'"
            row_stats = duckdb.sql(query).fetchone()
            
            stats = {}
            for i, col in enumerate(col_names):
                non_null_count = row_stats[i * 2]
                distinct_count = row_stats[i * 2 + 1]
                null_count = processed_rows - non_null_count
                stats[col] = {
                    "null_count": null_count,
                    "distinct_count": distinct_count,
                    "type": next(c[1] for c in columns if c[0] == col)
                }
            
            target_schema = job_data.get("target_schema", {})
            semantic_meta = {}
            if self.llm_engine:
                try:
                    semantic_meta = self.llm_engine.generate_metadata_descriptions(target_schema, stats)
                except Exception as e:
                    print(f"Failed to generate semantic metadata: {e}")
            
            # Create metadata rows
            with open(local_metadata_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["Global Description", semantic_meta.get("global_description", "N/A")])
                writer.writerow(["Total Rows", processed_rows])
                writer.writerow(["Original File", original_name])
                writer.writerow(["Processed At", timestamp])
                writer.writerow([])
                writer.writerow(["Column Name", "Data Type", "Null Count", "Distinct Count", "Description"])
                
                col_desc = semantic_meta.get("column_descriptions", {})
                for col in col_names:
                    writer.writerow([
                        col, 
                        stats[col]["type"], 
                        stats[col]["null_count"], 
                        stats[col]["distinct_count"],
                        col_desc.get(col, "N/A")
                    ])
                    
            # Create Zip file
            with zipfile.ZipFile(local_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(local_csv, arcname="data.csv")
                zf.write(local_metadata_csv, arcname="metadata.csv")
                
            with open(local_zip, 'rb') as f:
                zip_bytes = f.read()
                
            download_url = self.storage_svc.upload_file_bytes(
                settings.PROCESSED_BUCKET_NAME,
                output_file_name,
                zip_bytes,
                content_type="application/zip"
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

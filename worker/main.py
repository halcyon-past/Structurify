import os
import json
import base64
import time
import io
import traceback
from datetime import datetime, timedelta
from typing import Dict, Any, List

import pandas as pd
from fastapi import FastAPI, HTTPException, status, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from google.cloud import storage
from google.cloud import firestore
from google import genai
from google.genai import types

load_dotenv()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
if not project_id:
    import google.auth
    _, project_id = google.auth.default()

RAW_BUCKET_NAME = os.getenv("RAW_BUCKET_NAME", f"raw-uploads-{project_id}")
PROCESSED_BUCKET_NAME = os.getenv("PROCESSED_BUCKET_NAME", f"processed-outputs-{project_id}")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

storage_client = storage.Client(project=project_id)
db = firestore.Client(project=project_id)
ai_client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Structurify Worker Engine")


class PubSubMessage(BaseModel):
    message: dict
    subscription: str


def update_job_status(job_id: str, status: str, updates: Dict[str, Any] = None):
    job_ref = db.collection("jobs").document(job_id)
    data = {"status": status, "updated_at": datetime.utcnow().isoformat()}
    if updates:
        data.update(updates)
    job_ref.update(data)


@retry(
    wait=wait_exponential(multiplier=1, min=4, max=60),
    stop=stop_after_attempt(5),
    reraise=True
)
def call_gemini_api(chunk_data: str, target_schema: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Calls Gemini API with exponential backoff.
    Enforces JSON schema via system instructions and structured output if needed.
    """
    # Create the JSON schema required by Gemini structured output
    # target_schema is a dict like {"Name": "String", "Age": "Integer", ...}
    # We will build a pydantic-like or standard JSON schema for it
    
    properties = {}
    for key, value_type in target_schema.items():
        vtype = value_type.lower()
        if vtype == "integer":
            properties[key] = {"type": "integer"}
        elif vtype == "float":
            properties[key] = {"type": "number"}
        elif vtype == "boolean":
            properties[key] = {"type": "boolean"}
        else:
            properties[key] = {"type": "string"}

    response_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": properties,
            "required": list(properties.keys())
        }
    }

    system_instruction = (
        "You are a strict data transformation engine. "
        "Your task is to take the provided raw, messy CSV data and map it EXACTLY "
        "to the required target JSON schema. "
        "Rules:\n"
        "1. NO data loss: Every raw row must be mapped to a target row.\n"
        "2. Do not omit rows.\n"
        "3. Cast types correctly based on the target schema.\n"
        "4. If a field cannot be mapped or data is missing, provide a sensible default or null.\n"
        "5. Output must be valid JSON."
    )

    prompt = f"Map the following CSV data to the target schema:\n\n{chunk_data}"

    response = ai_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.1,
        ),
    )

    return json.loads(response.text)


def process_file(job_id: str, file_path: str, target_schema: Dict[str, Any]):
    start_time = time.time()
    update_job_status(job_id, "processing")
    
    try:
        # 1. Download file from GCS
        raw_bucket = storage_client.bucket(RAW_BUCKET_NAME)
        blob = raw_bucket.blob(file_path)
        file_bytes = blob.download_as_bytes()
        
        # 2. Parse File
        if file_path.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif file_path.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError("Unsupported file format. Must be CSV or XLSX.")
            
        total_rows = len(df)
        
        # 3. Chunk and Transform Data
        chunk_size = 50 # Adjust based on payload size limits
        all_processed_data = []
        
        for start_idx in range(0, total_rows, chunk_size):
            end_idx = min(start_idx + chunk_size, total_rows)
            chunk_df = df.iloc[start_idx:end_idx]
            
            # Convert chunk to CSV string for Gemini context
            chunk_csv = chunk_df.to_csv(index=False)
            
            # Call Gemini
            processed_chunk = call_gemini_api(chunk_csv, target_schema)
            all_processed_data.extend(processed_chunk)
            
        # 4. Compile to Excel
        processed_df = pd.DataFrame(all_processed_data)
        
        output_buffer = io.BytesIO()
        processed_df.to_excel(output_buffer, index=False, engine='openpyxl')
        output_buffer.seek(0)
        
        # 5. Upload to Processed Bucket
        processed_bucket = storage_client.bucket(PROCESSED_BUCKET_NAME)
        output_file_name = f"processed_{job_id}.xlsx"
        output_blob = processed_bucket.blob(f"outputs/{output_file_name}")
        output_blob.upload_from_file(output_buffer, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        # 6. Generate 7-day signed download URL
        download_url = output_blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=7),
            method="GET"
        )
        
        duration = time.time() - start_time
        
        # 7. Update status to completed
        update_job_status(job_id, "completed", {
            "download_url": download_url,
            "processed_rows": total_rows,
            "duration_seconds": round(duration, 2)
        })

    except Exception as e:
        error_message = str(e)
        stack_trace = traceback.format_exc()
        update_job_status(job_id, "failed", {
            "error_message": error_message,
            "stack_trace": stack_trace
        })
        print(f"Job {job_id} failed: {stack_trace}")
        raise e


@app.post("/process-job", status_code=status.HTTP_200_OK)
async def process_job(request: Request):
    """
    HTTP POST endpoint called by Pub/Sub Push Subscription
    """
    try:
        envelope = await request.json()
        if not envelope or 'message' not in envelope:
            raise HTTPException(status_code=400, detail="Invalid Pub/Sub message format")
            
        pubsub_message = envelope['message']
        
        if isinstance(pubsub_message, dict) and 'data' in pubsub_message:
            message_data = base64.b64decode(pubsub_message['data']).decode('utf-8')
            payload = json.loads(message_data)
            
            job_id = payload.get('job_id')
            file_path = payload.get('file_path')
            target_schema = payload.get('target_schema')
            
            if not job_id or not file_path or not target_schema:
                raise ValueError("Missing required fields in payload (job_id, file_path, target_schema)")
                
            # Process the file synchronously (Cloud Run expects request to block until processing is done)
            # Alternatively, if processing takes > timeout, we should return 200 and run in background thread,
            # but Cloud Run might throttle CPU if request finishes. Assuming processing fits within Cloud Run timeout (up to 60 mins).
            process_file(job_id, file_path, target_schema)
            
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        # If we return a 5xx, PubSub will retry based on its retry policy.
        # However, since we update the firestore doc to "failed" inside process_file,
        # we might want to return 200 so PubSub doesn't infinitely retry a fundamentally broken file.
        # But if it's a transient error not caught by tenacity, returning 500 is correct.
        # We'll return 200 to ack the message if we successfully caught it and updated DB to failed.
        # Let's let process_file raise so it retries on unexpected errors, but since process_file
        # updates the DB to "failed", retries might just re-fail. We'll return 200 to ACK.
        pass
        
    return {"status": "success"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

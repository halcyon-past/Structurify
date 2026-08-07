import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from google.cloud import storage
from google.cloud import pubsub_v1
from google.cloud import firestore

# Load environment variables
load_dotenv()

# Initialize Google Cloud clients
# Assuming GOOGLE_APPLICATION_CREDENTIALS or default credentials are set
project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
if not project_id:
    # Attempt to get from application default if not explicitly set
    import google.auth
    _, project_id = google.auth.default()

storage_client = storage.Client(project=project_id)
pubsub_publisher = pubsub_v1.PublisherClient()
db = firestore.Client(project=project_id)

app = FastAPI(title="Structurify Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
RAW_BUCKET_NAME = os.getenv("RAW_BUCKET_NAME", f"raw-uploads-{project_id}")
PUBSUB_TOPIC_ID = os.getenv("PUBSUB_TOPIC_ID", "schema-transformation-jobs")
topic_path = pubsub_publisher.topic_path(project_id, PUBSUB_TOPIC_ID)


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str = "text/csv"

class UploadUrlResponse(BaseModel):
    upload_url: str
    file_path: str


class JobRequest(BaseModel):
    file_path: str
    target_schema: Dict[str, Any] = Field(..., description="Target JSON schema definition")
    file_name: str

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    created_at: str
    download_url: Optional[str] = None
    processed_rows: Optional[int] = None
    error_message: Optional[str] = None


@app.post("/api/v1/upload-url", response_model=UploadUrlResponse)
async def generate_upload_url(request: UploadUrlRequest):
    """
    Generates a GCS V4 Signed URL for direct client uploads.
    """
    try:
        bucket = storage_client.bucket(RAW_BUCKET_NAME)
        # Generate a unique path for the file
        file_path = f"uploads/{uuid.uuid4()}/{request.filename}"
        blob = bucket.blob(file_path)

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),
            method="PUT",
            content_type=request.content_type,
        )
        return {"upload_url": url, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")


@app.post("/api/v1/jobs", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job(request: JobRequest):
    """
    Accepts file metadata and target JSON schema.
    Creates a job in Firestore and publishes a message to Pub/Sub.
    """
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    # 1. Create Job Document in Firestore
    job_ref = db.collection("jobs").document(job_id)
    job_data = {
        "job_id": job_id,
        "file_path": request.file_path,
        "file_name": request.file_name,
        "target_schema": request.target_schema,
        "status": "queued",
        "created_at": now,
        "updated_at": now
    }
    job_ref.set(job_data)

    # 2. Publish to Pub/Sub
    try:
        message_data = json.dumps({
            "job_id": job_id,
            "file_path": request.file_path,
            "target_schema": request.target_schema
        }).encode("utf-8")
        
        future = pubsub_publisher.publish(topic_path, data=message_data)
        future.result() # Wait for publish to succeed
        
    except Exception as e:
        # Mark as failed if publish fails
        job_ref.update({
            "status": "failed",
            "error_message": f"Failed to publish job: {str(e)}",
            "updated_at": datetime.utcnow().isoformat()
        })
        raise HTTPException(status_code=500, detail="Failed to queue job")

    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Job accepted and queued for processing."
    }


@app.get("/api/v1/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Fallback endpoint to check job execution state.
    """
    job_ref = db.collection("jobs").document(job_id)
    doc = job_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
        
    data = doc.to_dict()
    return JobStatusResponse(
        job_id=data.get("job_id"),
        status=data.get("status"),
        created_at=data.get("created_at"),
        download_url=data.get("download_url"),
        processed_rows=data.get("processed_rows"),
        error_message=data.get("error_message")
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}

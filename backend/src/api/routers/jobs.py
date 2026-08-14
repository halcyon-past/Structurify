import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Request
from src.models.schemas import JobRequest, JobResponse, JobStatusResponse
from src.api.dependencies import get_pubsub_service, get_firestore_service
from src.services.pubsub import PubSubService
from src.services.firestore import FirestoreService

router = APIRouter()

@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job(
    request: JobRequest,
    req: Request,
    pubsub_svc: PubSubService = Depends(get_pubsub_service),
    firestore_svc: FirestoreService = Depends(get_firestore_service)
):
    """
    Accepts file metadata and target JSON schema.
    Creates a job in Firestore and publishes a message to Pub/Sub.
    """
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    user_id = request.user_id
    ip_address = req.client.host if req.client else "unknown"
    
    # 1. Create Job Document
    try:
        firestore_svc.create_job(
            job_id, request.file_path, request.file_name, request.target_schema, now, 
            request.email, request.role, request.plan, user_id, ip_address
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job document: {str(e)}")

    # 2. Publish to Pub/Sub
    try:
        pubsub_svc.publish_job(
            job_id, request.file_path, request.target_schema, 
            request.email, request.role, request.plan, user_id, ip_address
        )
    except Exception as e:
        # Mark as failed if publish fails
        firestore_svc.update_job_status(
            job_id=job_id,
            status="failed",
            error_message=f"Failed to publish job: {str(e)}",
            updated_at=datetime.utcnow().isoformat()
        )
        raise HTTPException(status_code=500, detail="Failed to queue job")

    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Job accepted and queued for processing."
    }

@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    firestore_svc: FirestoreService = Depends(get_firestore_service)
):
    """
    Fallback endpoint to check job execution state.
    """
    data = firestore_svc.get_job(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return JobStatusResponse(
        job_id=data.get("job_id"),
        status=data.get("status"),
        created_at=data.get("created_at"),
        download_url=data.get("download_url"),
        processed_rows=data.get("processed_rows"),
        error_message=data.get("error_message"),
        total_chunks=data.get("total_chunks"),
        completed_chunks=data.get("completed_chunks")
    )

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

@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    firestore_svc: FirestoreService = Depends(get_firestore_service),
    pubsub_svc: PubSubService = Depends(get_pubsub_service)
):
    """
    Cancels a job by updating the Firestore job and audit documents.
    In-flight workers will see the 'cancelled' status and gracefully abort.
    """
    data = firestore_svc.get_job(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if data.get("status") in ["completed", "failed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Job cannot be cancelled because it is already {data.get('status')}")
        
    firestore_svc.cancel_job(job_id)
    if data.get("email"):
        pubsub_svc.publish_cancel_email(job_id, data.get("email"))
    
    return {"status": "cancelled", "message": "Job cancelled successfully"}

@router.post("/kill-switch")
async def kill_switch(
    firestore_svc: FirestoreService = Depends(get_firestore_service),
    pubsub_svc: PubSubService = Depends(get_pubsub_service)
):
    """
    Emergency Kill Switch: 
    1. Seeks all pub/sub subscriptions to the current timestamp to instantly purge the message queues.
    2. Marks all 'queued' and 'processing' jobs in Firestore as 'cancelled'.
    """
    try:
        from src.core.config import settings
        from google.cloud import pubsub_v1
        from google.protobuf.timestamp_pb2 import Timestamp
        
        project_id = settings.GOOGLE_CLOUD_PROJECT
        if not project_id:
            project_id = "structurify-504821" # fallback
            
        subscriber = pubsub_v1.SubscriberClient()
        timestamp = Timestamp()
        timestamp.GetCurrentTime()
        
        subs = [
            f"projects/{project_id}/subscriptions/schema-transformation-sub-push",
            f"projects/{project_id}/subscriptions/chunk-processing-sub-push",
            f"projects/{project_id}/subscriptions/schema-transformation-sub",
            f"projects/{project_id}/subscriptions/test-pull-sub"
        ]
        
        for sub in subs:
            try:
                subscriber.seek(
                    request={
                        "subscription": sub,
                        "time": timestamp
                    }
                )
            except Exception as e:
                print(f"Failed to seek subscription {sub}: {e}")
                
        # Update Firestore
        db = firestore_svc.db
        jobs_ref = db.collection("jobs")
        
        batch = db.batch()
        count = 0
        now = datetime.utcnow().isoformat()
        
        for job_status in ["queued", "processing", "processing_chunks"]:
            query = jobs_ref.where("status", "==", job_status).stream()
            for doc in query:
                
                batch.update(doc.reference, {
                    "status": "cancelled",
                    "updated_at": now,
                    "error_message": "Global Kill Switch Activated by Admin"
                })
                
                doc_data = doc.to_dict()
                if doc_data and doc_data.get("email"):
                    try:
                        pubsub_svc.publish_cancel_email(doc.id, doc_data.get("email"))
                    except Exception as e:
                        pass
                
                count += 1

                if count % 400 == 0:
                    batch.commit()
                    batch = db.batch()
                    
        if count % 400 != 0:
            batch.commit()
            
        return {"status": "success", "message": f"Purged queues and cancelled {count} ghost jobs."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/_admin/update-users")
async def admin_update_users(firestore_svc: FirestoreService = Depends(get_firestore_service)):
    db = firestore_svc.db
    users_ref = db.collection("users")
    docs = users_ref.stream()
    count = 0
    batch = db.batch()
    for doc in docs:
        user_data = doc.to_dict()
        updates = {}
        if "subscription_status" not in user_data: updates["subscription_status"] = "none"
        if "subscription_id" not in user_data: updates["subscription_id"] = None
        if "customer_id" not in user_data: updates["customer_id"] = None
        if "current_period_start" not in user_data: updates["current_period_start"] = None
        if "current_period_end" not in user_data: updates["current_period_end"] = None
        if "cancel_at_period_end" not in user_data: updates["cancel_at_period_end"] = False
        if "payment_date" not in user_data: updates["payment_date"] = None
        if "plan" not in user_data: updates["plan"] = "free"
        if updates:
            batch.update(doc.reference, updates)
            count += 1
    batch.commit()
    return {"status": "success", "updated_count": count}

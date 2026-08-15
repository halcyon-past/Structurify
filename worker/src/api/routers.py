import json
import base64
import time
from fastapi import APIRouter, HTTPException, status, Request
from google.cloud import firestore

from src.services.storage import StorageService
from src.services.firestore import FirestoreService
from src.services.llm_engine import LLMEngine
from src.services.file_parser import FileParserService
from src.services.chunk_processor import ChunkProcessorService
from src.services.reducer import ReducerService
from src.services.email_service import EmailService
from src.services.audit import AuditService
from src.core.config import settings

router = APIRouter()

storage_svc = StorageService()
firestore_svc = FirestoreService()
llm_engine = LLMEngine()
email_svc = EmailService()
audit_svc = AuditService(firestore_svc.db)
file_parser_svc = FileParserService(storage_svc, firestore_svc, email_svc, audit_svc)
chunk_processor_svc = ChunkProcessorService(llm_engine)
reducer_svc = ReducerService(storage_svc, firestore_svc, llm_engine, audit_svc)

CACHE_TTL_SECONDS = 15
_job_status_cache = {}

def _is_job_cancelled(job_id: str, db: firestore.Client) -> bool:
    now = time.time()
    
    # 1. Check Cache
    cached = _job_status_cache.get(job_id)
    if cached and (now - cached["timestamp"]) < CACHE_TTL_SECONDS:
        return cached["status"] == "cancelled"
        
    # 2. Cache Miss: Read Firestore
    job_ref = db.collection("jobs").document(job_id)
    job_doc = job_ref.get()
    
    status = job_doc.to_dict().get("status") if job_doc.exists else None
    
    # Update Cache
    _job_status_cache[job_id] = {
        "status": status,
        "timestamp": now
    }
    
    return status == "cancelled"

from typing import Dict, Any, Optional
from pydantic import BaseModel

class PubSubMessage(BaseModel):
    data: str
    messageId: Optional[str] = None
    publishTime: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None

class PubSubEnvelope(BaseModel):
    message: PubSubMessage
    subscription: str

@router.post("/process-job", status_code=status.HTTP_200_OK)
def process_job(envelope: PubSubEnvelope):
    """HTTP POST endpoint called by Pub/Sub Push Subscription (The Splitter)"""
    try:
        pubsub_message = envelope.message
        message_data = base64.b64decode(pubsub_message.data).decode('utf-8')
        payload = json.loads(message_data)
        
        job_id = payload.get('job_id')
        file_path = payload.get('file_path')
        target_schema = payload.get('target_schema')
        email = payload.get('email')
        
        if not job_id or not file_path or target_schema is None:
            raise ValueError("Missing required fields in payload")
            
        file_parser_svc.process_file(job_id, file_path, target_schema, email)
            
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        
    return {"status": "success"}

@router.post("/process-chunk", status_code=status.HTTP_200_OK)
def process_chunk(envelope: PubSubEnvelope):
    """HTTP POST endpoint called by Pub/Sub Push Subscription (The Mapper)"""
    try:
        pubsub_message = envelope.message
        message_data = base64.b64decode(pubsub_message.data).decode('utf-8')
        payload = json.loads(message_data)
        
        job_id = payload.get('job_id')
        chunk_id = payload.get('chunk_id')
        chunk_data = payload.get('chunk_data')
        target_schema = payload.get('target_schema')
        
        if not job_id or chunk_id is None or not chunk_data or target_schema is None:
            raise ValueError("Missing required fields in chunk payload")
            
        # 0. Check if job was cancelled
        db = firestore_svc.db
        if _is_job_cancelled(job_id, db):
            print(f"Job {job_id} is cancelled. Aborting chunk {chunk_id}.")
            return {"status": "success", "message": "aborted due to cancellation"}
            
        # 1. Map: Extract and self-correct using LangGraph
        results, chunk_tokens = chunk_processor_svc.process_chunk(chunk_data, target_schema)
        
        # 2. Save result to GCS
        result_json = json.dumps(results)
        storage_svc.upload_file_bytes(
            settings.RAW_BUCKET_NAME,
            f"jobs/{job_id}/results/chunk_{chunk_id}.json",
            result_json.encode('utf-8'),
            content_type="application/json"
        )
        
        # 3. Increment counter and check for reduce
        db = firestore_svc.db
        job_ref = db.collection("jobs").document(job_id)
        
        @firestore.transactional
        def increment_and_check(transaction, ref):
            snapshot = ref.get(transaction=transaction)
            if not snapshot.exists:
                return False
                
            data = snapshot.to_dict()
            completed = data.get("completed_chunks", 0) + 1
            total = data.get("total_chunks", 0)
            
            transaction.update(ref, {
                "completed_chunks": completed,
                "total_tokens": firestore.Increment(chunk_tokens)
            })
            
            return completed == total

        transaction = db.transaction()
        is_done = increment_and_check(transaction, job_ref)
        
        # 4. Reduce: If all chunks finished, merge them
        if is_done:
            print(f"Job {job_id} completely mapped. Triggering Reduce phase...")
            reducer_svc.reduce_job(job_id)
            
    except Exception as e:
        print(f"Error processing chunk: {str(e)}")
        
    return {"status": "success"}

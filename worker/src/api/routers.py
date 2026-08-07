import json
import base64
from fastapi import APIRouter, HTTPException, status, Request
from src.services.storage import StorageService
from src.services.firestore import FirestoreService
from src.services.llm_engine import LLMEngine
from src.services.file_parser import FileParserService

router = APIRouter()

# Instantiate services (in a real app, use dependency injection)
storage_svc = StorageService()
firestore_svc = FirestoreService()
llm_engine = LLMEngine()
file_parser_svc = FileParserService(storage_svc, firestore_svc, llm_engine)

@router.post("/process-job", status_code=status.HTTP_200_OK)
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
                
            file_parser_svc.process_file(job_id, file_path, target_schema)
            
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        
    return {"status": "success"}

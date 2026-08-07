from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

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

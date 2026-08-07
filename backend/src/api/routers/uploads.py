import uuid
from fastapi import APIRouter, HTTPException, Depends
from src.models.schemas import UploadUrlRequest, UploadUrlResponse
from src.api.dependencies import get_storage_service
from src.services.storage import StorageService

router = APIRouter()

@router.post("/upload-url", response_model=UploadUrlResponse)
async def generate_upload_url(
    request: UploadUrlRequest,
    storage_svc: StorageService = Depends(get_storage_service)
):
    """
    Generates a GCS V4 Signed URL for direct client uploads.
    """
    try:
        file_path = f"uploads/{uuid.uuid4()}/{request.filename}"
        url = storage_svc.generate_upload_url(file_path, request.content_type)
        return {"upload_url": url, "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")

import re

with open("backend/src/api/dependencies.py", "r") as f:
    content = f.read()

new_deps = """from typing import Generator
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from src.services.storage import StorageService
from src.services.pubsub import PubSubService
from src.services.firestore import FirestoreService

# Dependency injection for FastAPI routes

def get_storage_service() -> StorageService:
    return StorageService()

def get_pubsub_service() -> PubSubService:
    return PubSubService()

def get_firestore_service() -> FirestoreService:
    return FirestoreService()

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def get_current_admin(
    decoded_token: dict = Security(get_current_user),
    firestore_svc: FirestoreService = Depends(get_firestore_service)
):
    uid = decoded_token.get("uid")
    user_doc = firestore_svc.db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=403, detail="User not found")
    
    user_data = user_doc.to_dict()
    role = user_data.get("role", "").lower()
    if role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return decoded_token
"""

with open("backend/src/api/dependencies.py", "w") as f:
    f.write(new_deps)

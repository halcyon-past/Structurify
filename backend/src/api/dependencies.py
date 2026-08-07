from typing import Generator
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

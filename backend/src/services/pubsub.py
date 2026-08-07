import json
from google.cloud import pubsub_v1
from src.core.config import settings

def get_pubsub_publisher() -> pubsub_v1.PublisherClient:
    return pubsub_v1.PublisherClient()

class PubSubService:
    def __init__(self, publisher: pubsub_v1.PublisherClient = None):
        self.publisher = publisher or get_pubsub_publisher()
        self.topic_path = self.publisher.topic_path(settings.GOOGLE_CLOUD_PROJECT, settings.PUBSUB_TOPIC_ID)

    def publish_job(self, job_id: str, file_path: str, target_schema: dict):
        message_data = json.dumps({
            "job_id": job_id,
            "file_path": file_path,
            "target_schema": target_schema
        }).encode("utf-8")
        
        future = self.publisher.publish(self.topic_path, data=message_data)
        future.result()  # Wait for publish to succeed

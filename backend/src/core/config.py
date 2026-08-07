import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    RAW_BUCKET_NAME: str = os.getenv("RAW_BUCKET_NAME", "")
    PUBSUB_TOPIC_ID: str = os.getenv("PUBSUB_TOPIC_ID", "")

    class Config:
        env_file = ".env"

settings = Settings()

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    RAW_BUCKET_NAME: str = os.getenv("RAW_BUCKET_NAME", "")
    PROCESSED_BUCKET_NAME: str = os.getenv("PROCESSED_BUCKET_NAME", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()

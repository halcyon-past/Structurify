import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    RAW_BUCKET_NAME: str = os.getenv("RAW_BUCKET_NAME", "")
    PROCESSED_BUCKET_NAME: str = os.getenv("PROCESSED_BUCKET_NAME", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

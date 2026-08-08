import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    RAW_BUCKET_NAME: str = os.getenv("RAW_BUCKET_NAME", "")
    PROCESSED_BUCKET_NAME: str = os.getenv("PROCESSED_BUCKET_NAME", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Email Config
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

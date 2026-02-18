"""Configuration management for the application."""
import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseModel):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    API_TITLE: str = "AI Floor Plan Generator"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Generate floor plans from house exterior images"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 7860
    DEBUG: bool = False
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://example.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "anon-key-placeholder")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "service-key-placeholder")
    SUPABASE_BUCKET_INPUT: str = os.getenv("SUPABASE_BUCKET_INPUT", "input-images")
    SUPABASE_BUCKET_OUTPUT: str = os.getenv("SUPABASE_BUCKET_OUTPUT", "output-layouts")
    
    # Model Paths
    VIT_MODEL_PATH: str = os.getenv("VIT_MODEL_PATH", "google/vit-base-patch16-224")
    SD_MODEL_PATH: str = os.getenv("SD_MODEL_PATH", "runwayml/stable-diffusion-v1-5")
    CONTROLNET_MODEL_PATH: str = os.getenv("CONTROLNET_MODEL_PATH", "lllyasviel/control_v11p_sd15_canny")
    SAM_MODEL_PATH: str = os.getenv("SAM_MODEL_PATH", "models/sam_vit_b_01ec64.pth")
    
    # Processing
    MAX_QUEUE_SIZE: int = int(os.getenv("MAX_QUEUE_SIZE", "10"))
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", "1"))
    JOB_TIMEOUT_SECONDS: int = int(os.getenv("JOB_TIMEOUT_SECONDS", "300"))
    
    # CORS
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,https://*.vercel.app").split(",")


# Global settings instance
settings = Settings()

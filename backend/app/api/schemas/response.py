"""Pydantic response models."""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Literal
from datetime import datetime


class JobResponse(BaseModel):
    """Response model for job creation."""
    
    job_id: str
    status: Literal["pending", "processing", "completed", "failed", "cancelled"]
    created_at: datetime
    estimated_completion_time: int = Field(..., description="Estimated time in seconds")
    status_url: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_abc123",
                "status": "pending",
                "created_at": "2026-02-16T12:00:00Z",
                "estimated_completion_time": 15,
                "status_url": "/api/jobs/job_abc123"
            }
        }


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    
    job_id: str
    status: Literal["pending", "processing", "completed", "failed", "cancelled"]
    stage: Optional[str] = None
    progress: float = Field(0.0, ge=0.0, le=1.0)
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_time_remaining: Optional[int] = None
    result_url: Optional[str] = None
    error: Optional[str] = None


class ResultResponse(BaseModel):
    """Response model for generation result."""
    
    job_id: str
    status: str
    input_image_url: str
    output_image_url: str
    metadata: dict
    processing_time_seconds: float
    completed_at: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_abc123",
                "status": "completed",
                "input_image_url": "https://supabase.co/storage/inputs/house.jpg",
                "output_image_url": "https://supabase.co/storage/outputs/layout.png",
                "metadata": {
                    "total_area_sqft": 1200,
                    "rooms": []
                },
                "processing_time_seconds": 14.5,
                "completed_at": "2026-02-16T12:01:00Z"
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check."""
    
    status: str
    version: str
    gpu_available: bool
    models_loaded: bool
    queue_size: int
    uptime_seconds: int

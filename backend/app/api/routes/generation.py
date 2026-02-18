"""Generation endpoints."""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import uuid

from app.api.schemas.request import GenerateRequest
from app.api.schemas.response import JobResponse
from app.core.queue import job_queue
from app.services.database import create_job

router = APIRouter(prefix="/api", tags=["generation"])


def generate_job_id() -> str:
    """Generate unique job ID."""
    return f"job_{uuid.uuid4().hex[:12]}"


@router.post("/generate", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_layout(
    request: GenerateRequest,
):
    """
    Submit a floor plan generation job.
    
    **Process:**
    1. Validates the image URL
    2. Creates a job in the database
    3. Adds job to processing queue
    4. Returns job ID for status tracking
    
    **Args:**
        request: Generation request with image URL and options
    
    **Returns:**
        Job details with ID and status URL
    """
    
    # Generate job ID
    job_id = generate_job_id()
    
    # Create job in database
    job = await create_job(
        job_id=job_id,
        user_id=request.user_id,
        image_url=str(request.image_url),
        options=request.options or {}
    )
    
    # Add to queue (worker picks it up automatically)
    await job_queue.enqueue(job_id, {
        "image_url": str(request.image_url),
        "user_id": request.user_id,
        "options": request.options or {}
    })
    
    print(f"📋 Job {job_id} enqueued for processing")
    
    return JobResponse(
        job_id=job_id,
        status="pending",
        created_at=datetime.utcnow(),
        estimated_completion_time=15,
        status_url=f"/api/jobs/{job_id}"
    )


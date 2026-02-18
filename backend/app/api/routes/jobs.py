"""Job status and result endpoints."""
from fastapi import APIRouter, HTTPException, status

from app.api.schemas.response import JobStatusResponse, ResultResponse
from app.services.database import get_job, get_result

router = APIRouter(prefix="/api", tags=["jobs"])


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get job status and progress.
    
    **Args:**
        job_id: Unique job identifier
    
    **Returns:**
        Job status with progress information
    
    **Raises:**
        404: Job not found
    """
    
    # Get job from database
    job = await get_job(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    # Calculate ETA
    eta = None
    if job.get("status") == "processing" and job.get("progress", 0) > 0:
        # Estimate: 15 seconds total, calculate remaining
        eta = int(15 * (1 - job.get("progress", 0)))
    
    return JobStatusResponse(
        job_id=job["id"],
        status=job["status"],
        stage=job.get("stage"),
        progress=job.get("progress", 0.0),
        created_at=job["created_at"],
        started_at=job.get("started_at"),
        completed_at=job.get("completed_at"),
        estimated_time_remaining=eta,
        result_url=f"/api/jobs/{job_id}/result" if job["status"] == "completed" else None,
        error=job.get("error_message")
    )


@router.get("/jobs/{job_id}/result", response_model=ResultResponse)
async def get_job_result(job_id: str):
    """
    Get generation result for completed job.
    
    **Args:**
        job_id: Unique job identifier
    
    **Returns:**
        Complete generation result with metadata
    
    **Raises:**
        404: Job or result not found
        400: Job not completed
    """
    
    # Get job from database
    job = await get_job(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    if job["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job not completed (current status: {job['status']})"
        )
    
    # Get result
    result = await get_result(job_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Result not found for job {job_id}"
        )
    
    return ResultResponse(
        job_id=job_id,
        status=job["status"],
        input_image_url=job["input_image_url"],
        output_image_url=result["output_image_url"],
        metadata=result["metadata"],
        processing_time_seconds=result["processing_time_seconds"],
        completed_at=job["completed_at"]
    )


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a pending or processing job.
    
    **Args:**
        job_id: Unique job identifier
    
    **Returns:**
        Cancellation confirmation
    
    **Raises:**
        404: Job not found
        400: Job cannot be cancelled (already completed/failed)
    """
    
    # TODO: Implement job cancellation
    # This requires removing from queue and updating status
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Job cancellation not yet implemented"
    )


"""Health check endpoint."""
from fastapi import APIRouter
import time


from app.config import settings
from app.api.schemas.response import HealthResponse

router = APIRouter(tags=["health"])

# Track startup time
START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns application health status, GPU availability, and system info.
    """
    try:
        import torch
        gpu_available = torch.cuda.is_available()
    except ImportError:
        gpu_available = False

    return HealthResponse(
        status="healthy",
        version=settings.API_VERSION,
        gpu_available=gpu_available,
        models_loaded=True,  # TODO: Check actual model loading status
        queue_size=0,  # TODO: Get from job queue
        uptime_seconds=int(time.time() - START_TIME)
    )

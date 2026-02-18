"""FastAPI application entry point."""
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.api.routes import generation, jobs, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 Starting AI Floor Plan Generator...")
    print(f"📦 Model config: {settings.SD_MODEL_PATH}")
    
    # Start background worker
    from app.core.worker import process_queue
    worker_task = asyncio.create_task(process_queue())
    print("✅ Background worker started!")
    
    print("✅ Application ready!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (for local output fallback)
os.makedirs("temp_outputs", exist_ok=True)
app.mount("/static", StaticFiles(directory="temp_outputs"), name="static")

# Include routers
app.include_router(generation.router)
app.include_router(jobs.router)
app.include_router(health.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Floor Plan Generator API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

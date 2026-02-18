"""Background worker for processing jobs."""
import asyncio
import traceback
from typing import Callable, Optional

from app.core.queue import job_queue
from app.services.database import update_job_status, save_result
from app.services.inference import run_inference_pipeline

# Track if worker is already running to prevent duplicate loops
_worker_running = False
_worker_lock = asyncio.Lock()


async def process_queue():
    """
    Continuously process jobs from the queue.
    
    This runs as a background task and processes jobs one at a time.
    Uses a lock to prevent duplicate worker loops.
    """
    global _worker_running
    
    async with _worker_lock:
        if _worker_running:
            print("⚠️  Worker already running, skipping duplicate")
            return
        _worker_running = True
    
    print("🔄 Worker started, monitoring queue...")
    
    try:
        while True:
            # Get next job
            job = await job_queue.dequeue()
            
            if job is None:
                await asyncio.sleep(1)  # Wait if queue is empty
                continue
            
            job_id = job["job_id"]
            job_data = job["data"]
            
            print(f"▶️  Processing job: {job_id}")
            
            try:
                # Mark as processing
                await update_job_status(job_id, "processing", stage="download", progress=0.0)
                
                # Track pending progress tasks to avoid race conditions
                pending_tasks = []
                
                def progress_callback(stage, progress):
                    task = asyncio.create_task(
                        update_progress(job_id, stage, progress)
                    )
                    pending_tasks.append(task)
                
                # Run inference pipeline with timeout
                try:
                    result = await asyncio.wait_for(
                        run_inference_pipeline(
                            image_url=job_data["image_url"],
                            options=job_data.get("options", {}),
                            job_id=job_id,
                            progress_callback=progress_callback
                        ),
                        timeout=300  # 5 minute timeout
                    )
                except asyncio.TimeoutError:
                    raise RuntimeError("Job timed out after 5 minutes")
                
                # Wait for all pending progress updates to complete
                if pending_tasks:
                    await asyncio.gather(*pending_tasks, return_exceptions=True)
                    pending_tasks.clear()
                
                # Save result to database
                await save_result(
                    job_id=job_id,
                    output_image_url=result["output_image_url"],
                    metadata=result["metadata"],
                    processing_time=result["processing_time"]
                )
                
                # Mark as completed (after all progress tasks are done)
                await update_job_status(job_id, "completed", progress=1.0)
                
                print(f"✅ Job completed: {job_id} in {result['processing_time']:.2f}s")
                
            except Exception as e:
                # Mark as failed with detailed error
                error_msg = str(e)
                print(f"❌ Job failed: {job_id} - {error_msg}")
                traceback.print_exc()
                await update_job_status(job_id, "failed", error=error_msg)
            
            finally:
                # Remove from processing
                await job_queue.complete(job_id)
    
    except Exception as e:
        print(f"💀 Worker crashed: {e}")
        traceback.print_exc()
    finally:
        async with _worker_lock:
            _worker_running = False
        print("🛑 Worker stopped")


async def update_progress(job_id: str, stage: str, progress: float):
    """
    Update job progress in database.
    
    Args:
        job_id: Job identifier
        stage: Current processing stage
        progress: Progress value (0.0 to 1.0)
    """
    try:
        await update_job_status(
            job_id,
            status="processing",
            stage=stage,
            progress=progress
        )
    except Exception as e:
        print(f"⚠️  Failed to update progress for {job_id}: {e}")

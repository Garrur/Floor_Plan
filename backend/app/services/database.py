"""Database operations using Supabase."""
from typing import Optional, Dict, Any
from datetime import datetime

from app.config import settings

try:
    from supabase import create_client, Client
    
    # Skip if using placeholder credentials
    if "example" in settings.SUPABASE_URL or "placeholder" in settings.SUPABASE_SERVICE_KEY:
        print("⚠️  Supabase not configured (placeholder credentials). Using local storage.")
        supabase = None
    else:
        # Test DNS resolution first to avoid slow timeouts on every API call
        import socket
        from urllib.parse import urlparse
        try:
            hostname = urlparse(settings.SUPABASE_URL).hostname
            socket.getaddrinfo(hostname, 443, socket.AF_INET, socket.SOCK_STREAM)
            
            supabase: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
            print(f"✅ Supabase connected to {hostname}")
        except socket.gaierror:
            print(f"⚠️  Cannot resolve Supabase host ({hostname}). Using local storage.")
            supabase = None
except Exception as e:
    print(f"⚠️  Warning: Could not initialize Supabase: {e}")
    supabase = None



# Global in-memory validation for local mode
_local_jobs: Dict[str, Dict[str, Any]] = {}
_local_results: Dict[str, Dict[str, Any]] = {}

async def create_job(
    job_id: str,
    user_id: str,
    image_url: str,
    options: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create a new job in the database.
    """
    if not supabase:
        # Store in local memory
        job_data = {
            "id": job_id,
            "user_id": user_id,
            "status": "pending",
            "input_image_url": image_url,
            "options": options,
            "created_at": datetime.utcnow().isoformat(),
            "progress": 0.0
        }
        _local_jobs[job_id] = job_data
        print(f"📝 Local job created: {job_id}")
        return job_data
    
    data = {
        "id": job_id,
        "user_id": user_id,
        "status": "pending",
        "input_image_url": image_url,
        "options": options,
        "progress": 0.0
    }
    
    try:
        result = supabase.table("jobs").insert(data).execute()
        return result.data[0] if result.data else data
    except Exception as e:
        print(f"⚠️  Supabase insert failed, using local storage: {e}")
        # Fallback to local memory
        job_data = {
            "id": job_id,
            "user_id": user_id,
            "status": "pending",
            "input_image_url": image_url,
            "options": options,
            "created_at": datetime.utcnow().isoformat(),
            "progress": 0.0
        }
        _local_jobs[job_id] = job_data
        return job_data


async def update_job_status(
    job_id: str,
    status: str,
    stage: Optional[str] = None,
    progress: Optional[float] = None,
    error: Optional[str] = None
) -> None:
    """
    Update job status in database.
    """
    if not supabase:
        if job_id in _local_jobs:
            # Don't overwrite terminal status with processing
            current_status = _local_jobs[job_id].get("status")
            if current_status in ("completed", "failed", "cancelled") and status == "processing":
                return
            
            _local_jobs[job_id]["status"] = status
            if stage:
                _local_jobs[job_id]["stage"] = stage
            if progress is not None:
                _local_jobs[job_id]["progress"] = progress
            if error:
                _local_jobs[job_id]["error_message"] = error
            
            # Set timestamps
            if status == "processing" and "started_at" not in _local_jobs[job_id]:
                _local_jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
            elif status in ["completed", "failed", "cancelled"]:
                _local_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
                
            print(f"📝 Local update: Job {job_id} -> {status} ({progress})")
        return
    
    update_data = {"status": status}
    
    if stage:
        update_data["stage"] = stage
    if progress is not None:
        update_data["progress"] = progress
    if error:
        update_data["error_message"] = error
    
    # Set timestamps
    if status == "processing" and "started_at" not in update_data:
        update_data["started_at"] = datetime.utcnow().isoformat()
    elif status in ["completed", "failed", "cancelled"]:
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    try:
        supabase.table("jobs").update(update_data).eq("id", job_id).execute()
    except Exception as e:
        print(f"⚠️  Supabase update failed, using local: {e}")
        if job_id in _local_jobs:
            _local_jobs[job_id].update(update_data)
            print(f"📝 Local update: Job {job_id} -> {status} ({progress})")


async def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get job from database.
    """
    if not supabase:
        return _local_jobs.get(job_id)
    
    try:
        result = supabase.table("jobs").select("*").eq("id", job_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"⚠️  Supabase get_job failed, using local: {e}")
        return _local_jobs.get(job_id)


async def save_result(
    job_id: str,
    output_image_url: str,
    metadata: Dict[str, Any],
    processing_time: float
) -> None:
    """
    Save generation result to database.
    """
    if not supabase:
        _local_results[job_id] = {
            "job_id": job_id,
            "output_image_url": output_image_url,
            "metadata": metadata,
            "processing_time_seconds": processing_time
        }
        print(f"💾 Local save: Result for job {job_id}")
        return
    
    data = {
        "job_id": job_id,
        "output_image_url": output_image_url,
        "metadata": metadata,
        "processing_time_seconds": processing_time
    }
    
    try:
        supabase.table("results").insert(data).execute()
    except Exception as e:
        print(f"⚠️  Supabase save_result failed, using local: {e}")
        _local_results[job_id] = data


async def get_result(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get result from database.
    """
    if not supabase:
        return _local_results.get(job_id)
    
    try:
        result = supabase.table("results").select("*").eq("job_id", job_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"⚠️  Supabase get_result failed, using local: {e}")
        return _local_results.get(job_id)

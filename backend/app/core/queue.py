"""Job queue management."""
import asyncio
from typing import Dict, Any, Optional
from collections import deque
from datetime import datetime


class JobQueue:
    """
    Simple in-memory job queue.
    
    For production, consider using Redis Queue or Celery.
    """
    
    def __init__(self):
        self.queue = deque()
        self.processing: Dict[str, Any] = {}
        self.lock = asyncio.Lock()
    
    async def enqueue(self, job_id: str, job_data: Dict[str, Any]) -> None:
        """
        Add job to queue.
        
        Args:
            job_id: Unique job identifier
            job_data: Job parameters and metadata
        """
        async with self.lock:
            self.queue.append({
                "job_id": job_id,
                "data": job_data,
                "enqueued_at": datetime.utcnow()
            })
    
    async def dequeue(self) -> Optional[Dict[str, Any]]:
        """
        Get next job from queue.
        
        Returns:
            Job dict or None if queue is empty
        """
        async with self.lock:
            if self.queue:
                job = self.queue.popleft()
                self.processing[job["job_id"]] = job
                return job
        return None
    
    async def complete(self, job_id: str) -> None:
        """Mark job as completed and remove from processing."""
        async with self.lock:
            if job_id in self.processing:
                del self.processing[job_id]
    
    async def size(self) -> int:
        """Get current queue size."""
        return len(self.queue)
    
    def is_processing(self, job_id: str) -> bool:
        """Check if job is currently being processed."""
        return job_id in self.processing


# Global queue instance
job_queue = JobQueue()

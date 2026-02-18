"""Supabase storage client."""
from typing import BinaryIO
import httpx
from io import BytesIO
from PIL import Image

from app.config import settings

try:
    from supabase import create_client, Client
    
    # Skip if using placeholder credentials
    if "example" in settings.SUPABASE_URL or "placeholder" in settings.SUPABASE_SERVICE_KEY:
        supabase = None
    else:
        # Test DNS resolution first to avoid slow timeouts on every call
        import socket
        from urllib.parse import urlparse
        try:
            hostname = urlparse(settings.SUPABASE_URL).hostname
            socket.getaddrinfo(hostname, 443, socket.AF_INET, socket.SOCK_STREAM)
            
            supabase: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY
            )
        except socket.gaierror:
            print(f"⚠️  Cannot resolve Supabase host. Storage using local fallback.")
            supabase = None
except Exception as e:
    print(f"⚠️  Warning: Could not initialize Supabase: {e}")
    supabase = None


async def upload_image(image: Image.Image, job_id: str, bucket: str = None) -> str:
    """
    Upload image to Supabase Storage.
    
    Args:
        image: PIL Image object
        job_id: Job ID for file naming
        bucket: Storage bucket name (default: output bucket)
    
    Returns:
        Public URL of uploaded image
    """
    if not supabase:
        raise RuntimeError("Supabase client not initialized")
    
    bucket_name = bucket or settings.SUPABASE_BUCKET_OUTPUT
    
    # Convert image to bytes
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    
    # Upload file
    file_path = f"{job_id}.png"
    
    result = supabase.storage.from_(bucket_name).upload(
        file_path,
        buffer.read(),
        {"content-type": "image/png"}
    )
    
    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
    
    return public_url


async def download_image(image_url: str) -> Image.Image:
    """
    Download image from URL.
    
    Args:
        image_url: HTTP(S) URL or Supabase storage path
    
    Returns:
        PIL Image object
    """
    try:
        if image_url.startswith("http://") or image_url.startswith("https://"):
            # External URL - download via HTTP
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url, timeout=30.0)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content))
        else:
            # Supabase storage path
            if not supabase:
                raise RuntimeError("Supabase client not initialized")
            
            bucket_name = settings.SUPABASE_BUCKET_INPUT
            data = supabase.storage.from_(bucket_name).download(image_url)
            image = Image.open(BytesIO(data))
        
        return image.convert("RGB")
    
    except Exception as e:
        raise RuntimeError(f"Failed to download image: {e}")


async def validate_image_url(image_url: str) -> bool:
    """
    Validate that image URL is accessible.
    
    Args:
        image_url: URL to validate
    
    Returns:
        True if accessible, False otherwise
    """
    try:
        await download_image(image_url)
        return True
    except Exception:
        return False

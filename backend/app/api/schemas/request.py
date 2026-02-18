"""Pydantic request models."""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional


class GenerateRequest(BaseModel):
    """Request model for floor plan generation."""
    
    image_url: str = Field(..., description="URL of the exterior house image")
    user_id: str = Field(..., description="User ID from auth system")
    options: Optional[dict] = Field(
        default_factory=lambda: {
            "constraint": "custom",
            "num_inference_steps": 20,
            "guidance_scale": 7.5,
            "controlnet_conditioning_scale": 0.8
        },
        description="Generation options"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_url": "https://supabase.co/storage/v1/object/public/inputs/house.jpg",
                "user_id": "user-123",
                "options": {
                    "constraint": "2bhk",
                    "num_inference_steps": 20
                }
            }
        }

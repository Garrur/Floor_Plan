"""Layout generation using Stable Diffusion + ControlNet."""
import torch
import numpy as np
from PIL import Image
from typing import Optional, Callable
from diffusers import (
    StableDiffusionPipeline,
    StableDiffusionControlNetPipeline,
    ControlNetModel,
    DDIMScheduler
)
from controlnet_aux import CannyDetector

from app.config import settings


class LayoutGenerator:
    """
    Stable Diffusion 1.5 based layout generator.
    
    Uses ControlNet for structural guidance from exterior images.
    """
    
    def __init__(
        self,
        sd_model_path: Optional[str] = None,
        controlnet_path: Optional[str] = None
    ):
        """
        Initialize Stable Diffusion pipeline.
        
        Args:
            sd_model_path: HuggingFace SD model path
            controlnet_path: ControlNet model path
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        sd_model_path = sd_model_path or settings.SD_MODEL_PATH
        controlnet_path = controlnet_path or settings.CONTROLNET_MODEL_PATH
        
        print(f"📦 Loading Stable Diffusion from {sd_model_path}...")
        print(f"📦 Loading ControlNet from {controlnet_path}...")
        
        # Load ControlNet
        self.controlnet = ControlNetModel.from_pretrained(
            controlnet_path,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )
        
        # Load SD pipeline with ControlNet
        self.pipe = StableDiffusionControlNetPipeline.from_pretrained(
            sd_model_path,
            controlnet=self.controlnet,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            safety_checker=None  # Disable for floor plans
        )
        
        # Use DDIM scheduler for faster inference
        self.pipe.scheduler = DDIMScheduler.from_config(self.pipe.scheduler.config)
        
        # Enable optimizations
        self.pipe.to(self.device)
        
        if torch.cuda.is_available():
            # Enable xformers memory efficient attention
            try:
                self.pipe.enable_xformers_memory_efficient_attention()
                print("✅ xFormers enabled")
            except Exception as e:
                print(f"⚠️  xFormers not available: {e}")
        
        # Canny edge detector for ControlNet
        self.canny_detector = CannyDetector()
        
        print(f"✅ Layout generator ready on {self.device}")
    
    def generate(
        self,
        embedding: np.ndarray,
        control_image: Optional[Image.Image] = None,
        num_inference_steps: int = 20,
        guidance_scale: float = 7.5,
        controlnet_conditioning_scale: float = 0.8,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Image.Image:
        """
        Generate floor plan layout.
        
        Args:
            embedding: Exterior image embedding (768-dim)
            control_image: Optional control image for ControlNet
            num_inference_steps: Number of diffusion steps
            guidance_scale: Classifier-free guidance scale
            controlnet_conditioning_scale: ControlNet influence
            progress_callback: Callback for progress updates
        
        Returns:
            Generated floor plan image (512x512)
        """
        # Create prompt from embedding (simplified)
        # In practice, you'd use a more sophisticated embedding → text mapping
        prompt = "architectural floor plan, top-down view, clean lines, professional blueprint"
        
        # Prepare control image if provided
        if control_image is not None:
            # Extract Canny edges as control signal
            control_image = self.canny_detector(
                control_image,
                low_threshold=100,
                high_threshold=200
            )
        else:
            # Create dummy control image
            control_image = Image.new("RGB", (512, 512), color="white")
        
        # Generate
        with torch.autocast("cuda" if torch.cuda.is_available() else "cpu"):
            result = self.pipe(
                prompt=prompt,
                image=control_image,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                controlnet_conditioning_scale=controlnet_conditioning_scale,
                callback=lambda step, ts, latents: self._callback(
                    step, num_inference_steps, progress_callback
                )
            )
        
        return result.images[0]
    
    def _callback(
        self,
        step: int,
        total_steps: int,
        progress_callback: Optional[Callable[[float], None]]
    ):
        """Internal callback for progress tracking."""
        if progress_callback:
            progress = step / total_steps
            progress_callback(progress)
    
    def generate_with_lora(
        self,
        embedding: np.ndarray,
        lora_path: Optional[str] = None,
        **kwargs
    ) -> Image.Image:
        """
        Generate with LoRA adapter.
        
        Args:
            embedding: Exterior image embedding
            lora_path: Path to LoRA weights
            **kwargs: Additional generation parameters
        
        Returns:
            Generated floor plan
        """
        # TODO: Load LoRA weights when available
        # if lora_path:
        #     self.pipe.load_lora_weights(lora_path)
        
        return self.generate(embedding, **kwargs)

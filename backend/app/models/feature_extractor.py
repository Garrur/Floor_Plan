"""Feature extraction using Vision Transformer (ViT)."""
import torch
import numpy as np
from PIL import Image
from typing import Optional
from transformers import ViTModel, ViTImageProcessor

from app.config import settings


class FeatureExtractor:
    """
    ViT-based feature extractor for house exterior images.
    
    Extracts 768-dimensional embedding from exterior image.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize ViT model.
        
        Args:
            model_path: HuggingFace model path or local path
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model_path = model_path or settings.VIT_MODEL_PATH
        
        print(f"📦 Loading ViT model from {model_path}...")
        
        # Load processor and model
        self.processor = ViTImageProcessor.from_pretrained(model_path)
        self.model = ViTModel.from_pretrained(model_path)
        self.model.to(self.device)
        self.model.eval()
        
        print(f"✅ ViT model loaded on {self.device}")
    
    @torch.no_grad()
    def extract(self, image: Image.Image) -> np.ndarray:
        """
        Extract features from image.
        
        Args:
            image: PIL Image (RGB)
        
        Returns:
            768-dimensional embedding vector
        """
        # Preprocess image
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Extract features
        outputs = self.model(**inputs)
        
        # Get CLS token embedding (first token)
        embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy()
        
        return embedding.squeeze()  # Shape: (768,)
    
    def extract_batch(self, images: list[Image.Image]) -> np.ndarray:
        """
        Extract features from multiple images.
        
        Args:
            images: List of PIL Images
        
        Returns:
            Embeddings array of shape (N, 768)
        """
        embeddings = []
        
        for image in images:
            embedding = self.extract(image)
            embeddings.append(embedding)
        
        return np.array(embeddings)
    
    def get_embedding_dim(self) -> int:
        """Get embedding dimension."""
        return 768

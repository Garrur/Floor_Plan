FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    wget \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip3 install --upgrade pip

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Download SAM model weights
RUN mkdir -p models && \
    wget -q https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth -P models/

# Pre-download HuggingFace models (optional, for faster startup)
RUN python3 -c "from transformers import ViTModel, ViTImageProcessor; \
    ViTModel.from_pretrained('google/vit-base-patch16-224'); \
    ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')"

RUN python3 -c "from diffusers import StableDiffusionPipeline; \
    StableDiffusionPipeline.from_pretrained('runwayml/stable-diffusion-v1-5')"

# Copy application code
COPY app/ /app/app/

# Expose port (HuggingFace Spaces uses 7860)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:7860/health')"

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

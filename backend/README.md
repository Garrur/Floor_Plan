# AI Floor Plan Generator - Backend

Backend API service for generating floor plans from house exterior images using AI.

## Features

- 🏠 Generate floor plans from exterior photos
- 🤖 Powered by Stable Diffusion + ControlNet
- 🔄 Async job queue system
- 📊 Real-time progress tracking
- ☁️ Supabase integration
- 🐳 Docker deployment ready

## Tech Stack

- **Framework:** FastAPI
- **AI Models:** 
  - ViT (Feature Extraction)
  - Stable Diffusion 1.5 (Generation)
  - ControlNet (Structural Guidance)
  - SAM (Room Segmentation)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage
- **Deployment:** HuggingFace Spaces (Docker)

## Local Development

### Prerequisites

- Python 3.10+
- CUDA 11.8+ (for GPU support)
- Virtual environment

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 7860
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:7860/docs
- ReDoc: http://localhost:7860/redoc

## API Endpoints

### Generation
- `POST /api/generate` - Submit generation job
- `GET /api/jobs/{job_id}` - Get job status
- `GET /api/jobs/{job_id}/result` - Get result
- `DELETE /api/jobs/{job_id}` - Cancel job

### Health
- `GET /health` - Health check

## Docker Deployment

```bash
# Build image
docker build -t floor-plan-generator .

# Run container
docker run -p 7860:7860 --gpus all \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_KEY=your-key \
  floor-plan-generator
```

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes and schemas
│   ├── core/         # Core functionality (queue, storage, worker)
│   ├── models/       # AI model wrappers
│   ├── services/     # Business logic
│   └── utils/        # Helper functions
├── tests/            # Unit tests
├── Dockerfile        # Docker configuration
└── requirements.txt  # Python dependencies
```

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT

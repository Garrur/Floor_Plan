# 🏠 FloorPlan AI

> Transform building exteriors into detailed floor plans using AI.

Upload a photo of any building exterior and get a labeled floor plan with rooms, dimensions, and quality scores — in under 30 seconds.

---

## ✨ Features

- **AI Floor Plan Generation** — Upload any exterior photo, get a full floor plan
- **5 Layout Styles** — Standard, Open Plan, L-Shaped, Corridor, Compact
- **Room Detection** — Labeled rooms with area (sq ft) and dimensions
- **Quality Scoring** — Spatial consistency score for each generation
- **Instant Download** — Export floor plans as high-res PNG
- **Real-time Progress** — Live generation progress with stage tracking
- **Cinematic UI** — Architectural dark theme with warm copper accents

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend** | FastAPI, Python 3.11+, Uvicorn |
| **AI Models** | ViT (feature extraction), Stable Diffusion (layout), SAM (post-processing) |
| **Database** | Supabase (PostgreSQL + Storage) |
| **State** | TanStack React Query, Zustand |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Garrur/Floor_Plan.git
cd Floor_Plan
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials (optional for demo mode)

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local if needed

# Run the dev server
npm run dev
```

### 4. Open the App

Visit **http://localhost:3000** to use the application.

---

## 📁 Project Structure

```
Floor_Plan/
├── backend/
│   ├── app/
│   │   ├── api/            # Routes & schemas
│   │   ├── core/           # Queue, storage, worker
│   │   ├── models/         # AI model wrappers
│   │   ├── services/       # Inference pipeline, database
│   │   └── main.py         # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/                # Next.js pages
│   │   ├── page.tsx        # Landing page
│   │   └── generate/       # Generation flow
│   ├── components/         # UI components
│   │   ├── display/        # Floor plan viewer
│   │   ├── progress/       # Progress tracker
│   │   ├── upload/         # Image upload & constraints
│   │   └── shared/         # Loading spinner, providers
│   ├── lib/                # API client, hooks, utils
│   └── types/              # TypeScript types
│
└── README.md
```

---

## 🗺️ Roadmap (Future Features)

Here are several high-impact features planned to enhance the AI Floor Plan Generator:

- [ ] **Professional PDF "Project Report" Export:** Generate a multi-page PDF including the original photo, 2D layout, 3D render snapshot, and the full Cost Estimator table.
- [ ] **Enhanced 2D Editor (Mini-CAD):** Expand the interactive editor to allow users to change room types (e.g., Bedroom to Office) and drag-and-drop doors/windows onto polygon walls.
- [ ] **Split-Screen Pro Dashboard:** View the 2D Editor and 3D Viewer side-by-side, with real-time 3D extrusion updates as users drag 2D walls.
- [ ] **AI Interior Design & Furniture:** Automatically suggest furniture placement overlays based on the identified room type, or use LLMs to suggest interior design styles based on the exterior photo.
- [ ] **Shareable "Client" Links:** Generate read-only viewer routes for architects to share the 3D model and Cost Estimator with clients without allowing edits.
- [ ] **Multi-story Generation:** Add support for "Floors" in the constraints panel to generate and stack multiple floor layouts in the 3D viewer.

---

## 🎨 Demo Mode

When no GPU is available, the app runs in **demo mode** — generating varied floor plans using deterministic seeding based on the input image. Different images produce different layouts.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ by [Garrur](https://github.com/Garrur)**

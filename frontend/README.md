# AI Floor Plan Generator - Frontend

A modern Next.js 15 web application for generating floor plans from house exterior images using AI.

## 🚀 Features

- **Drag & Drop Upload**: Easy image upload with preview
- **Layout Selection**: Choose between 1BHK, 2BHK, 3BHK, or Auto-detect
- **Real-time Progress**: Track AI processing with visual progress indicators
- **Interactive Viewer**: Zoom, download, and view floor plan metadata
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Type-safe**: Built with TypeScript for robust development

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Backend API** running at `http://localhost:8000` (see: `../backend`)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Supabase Configuration (Optional - for authentication and image storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note**: The application will work without Supabase configuration, but image uploads will use object URLs instead.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── generate/                # Generation flow
│   │   ├── page.tsx            # Upload & configure steps
│   │   └── [jobId]/            # Job status with polling
│   └── globals.css             # Global styles
│
├── components/
│   ├── ui/                      # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── progress.tsx
│   ├── upload/                  # Upload components
│   │   ├── ImageUpload.tsx     # Drag-and-drop
│   │   └── ConstraintSelector.tsx
│   ├── progress/
│   │   └── ProgressTracker.tsx # Stage-by-stage progress
│   ├── display/
│   │   └── FloorPlanViewer.tsx # Result viewer
│   └── shared/
│       ├── Providers.tsx        # React Query provider
│       └── LoadingSpinner.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts           # Axios client
│   │   └── generation.ts       # API endpoints
│   ├── hooks/
│   │   ├── useGeneration.ts    # Generation hooks
│   │   └── useUpload.ts        # Upload hook
│   ├── store/
│   │   └── generationStore.ts  # Zustand state
│   └── supabase/
│       └── client.ts           # Supabase client
│
└── types/
    ├── api.ts                   # API type definitions
    └── generation.ts            # Generation types
```

## 🎯 Usage

### 1. **Landing Page**
- Visit `http://localhost:3000`
- Click **"Get Started"** or **"Generate Floor Plan Now"**

### 2. **Upload House Exterior**
- Drag & drop an image or click to browse
- Supported formats: JPG, PNG (max 10MB)
- Preview your uploaded image

### 3. **Select Layout**
- Choose: 1BHK, 2BHK, 3BHK, or Auto-Detect
- Click **"Generate Floor Plan"**

### 4. **Monitor Progress**
- Real-time stage updates
- Visual progress bar
- Automatic refresh when complete

### 5. **View Result**
- Zoom in/out controls
- Download floor plan
- View metadata (rooms, area, quality score)

## 🔗 API Integration

The frontend communicates with the FastAPI backend:

### Key Endpoints:
- `POST /api/generate` - Submit generation job
- `GET /api/jobs/{job_id}` - Get job status (polled every 2s)
- `GET /api/jobs/{job_id}/result` - Get completed result

### Polling Strategy:
- React Query automatically polls job status every 2 seconds
- Polling stops when status becomes `completed` or `failed`

## 🎨 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn/ui |
| **State** | Zustand |
| **Data Fetching** | React Query |
| **HTTP Client** | Axios |
| **File Upload** | React Dropzone |
| **Icons** | Lucide React |
| **Backend (Optional)** | Supabase |

## 🚀 Deployment

### Deploy to Vercel (Free)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL` → Your production backend URL
   - `NEXT_PUBLIC_SUPABASE_URL` (if using Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if using Supabase)

### Automatic Deployment

Connect your GitHub repository to Vercel for automatic deployments on every push to `main`.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Landing page loads and renders correctly
- [ ] Navigation to /generate works
- [ ] Image upload accepts JPG/PNG files
- [ ] Image preview displays after upload
- [ ] Constraint selector allows selection
- [ ] Generation submits successfully (backend must be running)
- [ ] Job status page polls and updates progress
- [ ] Result displays floor plan image
- [ ] Metadata shows correct room count and area
- [ ] Zoom controls work
- [ ] Download button downloads the image

## 🐛 Troubleshooting

### Issue: "Failed to connect to backend"
**Solution**: Ensure the backend is running at `http://localhost:8000`

```bash
cd ../backend
.\venv\Scripts\Activate.ps1  # Windows
uvicorn app.main:app --reload
```

### Issue: Image upload fails
**Solution**: If Supabase is not configured, the app will use object URLs as a fallback. Check console for warnings.

### Issue: Job polling doesn't update
**Solution**: Verify the backend `/api/jobs/{job_id}` endpoint is returning proper status updates.

## 📝 License

MIT License - See parent project for details.

## 🤝 Contributing

This is part of the AI Floor Plan Generator project. See the main README for contribution guidelines.

## 📧 Support

For issues or questions, please open an issue on GitHub.

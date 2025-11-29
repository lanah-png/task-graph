# Firebase → FastAPI + Docker Migration Guide

## Overview

Your Task Graph application has been migrated from Firebase Cloud Functions to FastAPI with Docker support. This migration provides:

✅ **Streaming responses** via Server-Sent Events (SSE)
✅ **Better user experience** - see AI responses as they're generated
✅ **Full control** over backend infrastructure
✅ **Local development** with Docker
✅ **Easier deployment** to any platform

---

## What Changed

### Backend

#### Old (Firebase):
```
/functions
├── main.py                # Firebase callable function
└── /LLM_Model
    ├── basic.py
    └── tools.py
```

#### New (FastAPI):
```
/backend
├── main.py                # FastAPI app with streaming
├── requirements.txt       # Python dependencies
├── Dockerfile             # Backend container
├── .env                   # Environment variables
└── /llm_model
    ├── agent.py          # Migrated from basic.py
    └── tools.py          # Same logic, no Firebase deps
```

**Key Changes:**
- Removed Firebase dependencies
- Added FastAPI + Uvicorn
- API key now from environment variable (not Firebase param)
- Added streaming support with async generators
- Two endpoints: `/api/chat` (non-streaming) and `/api/chat/stream` (streaming)

### Frontend

#### Old:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
const helloWorld = httpsCallable(functions, 'hello_world');
const result = await helloWorld({ chatHistory, graph });
```

#### New:
```typescript
import { sendMessageStream } from '@/lib/api';
await sendMessageStream(
  { chatHistory, graph },
  onToken,        // Stream each token
  onGraphUpdate,  // Update graph
  onDone          // Complete
);
```

**Key Changes:**
- Removed Firebase SDK imports
- Created new API client (`src/lib/api.ts`)
- Streaming responses update UI in real-time
- Added proper TypeScript types

### Infrastructure

**Added:**
- `docker-compose.yml` - Orchestrates frontend + backend
- `backend/Dockerfile` - Python backend container
- `Dockerfile` - React frontend container
- `.dockerignore` files - Optimize builds
- Environment configuration files

---

## How to Run Locally

### 1. Prerequisites

- Docker & Docker Compose installed
- OpenAI API key

### 2. Set Up Environment

**Important:** Add your OpenAI API key to `/backend/.env`:

```bash
# Edit backend/.env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### 3. Start Everything

```bash
docker-compose up
```

This starts:
- **Backend** on http://localhost:8000
- **Frontend** on http://localhost:5173

### 4. Access the App

Open http://localhost:5173 in your browser

---

## File Structure

```
task-graph/
├── backend/                    # NEW: FastAPI backend
│   ├── main.py                 # API endpoints
│   ├── llm_model/
│   │   ├── agent.py            # DSPy agent (was basic.py)
│   │   └── tools.py            # Agent tools
│   ├── requirements.txt        # Python deps
│   ├── Dockerfile              # Backend container
│   └── .env                    # OpenAI API key (add yours!)
│
├── src/                        # Frontend (updated)
│   ├── lib/
│   │   └── api.ts              # NEW: FastAPI client
│   ├── pages/
│   │   └── Index.tsx           # Updated: uses streaming
│   └── firebase.ts             # Can be removed (optional)
│
├── docker-compose.yml          # NEW: Orchestration
├── Dockerfile                  # NEW: Frontend container
├── .env                        # Frontend env vars
├── .env.example                # Example config
│
├── README.docker.md            # Docker usage guide
└── MIGRATION_GUIDE.md          # This file
```

---

## API Endpoints

### Health Check
```
GET http://localhost:8000/
```

### Non-Streaming Chat (Backward Compatible)
```
POST http://localhost:8000/api/chat
Content-Type: application/json

{
  "chatHistory": [...],
  "graph": { "nodes": [], "links": [] }
}
```

### Streaming Chat (Recommended)
```
POST http://localhost:8000/api/chat/stream
Content-Type: application/json

{
  "chatHistory": [...],
  "graph": { "nodes": [], "links": [] }
}
```

Returns Server-Sent Events:
```
data: {"type": "token", "content": "Hello"}
data: {"type": "token", "content": " world"}
data: {"type": "graph_update", "graph_data": {...}}
data: {"type": "done"}
```

### Interactive API Docs

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Development Workflow

### Hot Reload

Both services support hot reload:

**Backend:**
```bash
# Edit files in /backend
# Server auto-restarts
```

**Frontend:**
```bash
# Edit files in /src
# Browser auto-refreshes
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild After Dependency Changes

```bash
docker-compose up --build
```

### Run Commands Inside Containers

```bash
# Backend shell
docker exec -it task-graph-backend /bin/bash

# Frontend shell
docker exec -it task-graph-frontend /bin/sh
```

---

## What About Firebase?

### Can I Still Use Firebase?

Yes! The old Firebase code is still in `/functions`. You have two options:

**Option A: Full Migration (Recommended)**
- Remove `/functions` directory
- Remove `firebase.json`
- Remove Firebase dependencies from frontend
- Delete `src/firebase.ts`

**Option B: Keep Both**
- Keep Firebase for other services (auth, storage, etc.)
- Use FastAPI backend for chat/AI features
- Remove only the `hello_world` function

### Removing Firebase (Clean Migration)

If you want to fully remove Firebase:

```bash
# Remove old functions
rm -rf functions/

# Remove Firebase config
rm firebase.json

# Update frontend (remove Firebase imports)
# Edit src/pages/Index.tsx - already done!
# Delete src/firebase.ts if not using Firebase at all
```

---

## Deployment (Next Steps)

The Docker setup makes deployment easy. Popular options:

### Google Cloud Run (Recommended)
- Stays in Google ecosystem
- Serverless-like auto-scaling
- Docker native

```bash
# Deploy backend
gcloud run deploy task-graph-backend \
  --source ./backend \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend (build static, use Firebase Hosting or Cloud Storage)
```

### Railway
- Simple deployment
- GitHub integration
- Good free tier

```bash
# Connect repo and deploy via Railway dashboard
```

### Render
- Similar to Railway
- Easy Docker deployment

### AWS (ECS/Fargate)
- More control
- More complex setup

---

## Troubleshooting

### "Connection refused" error

Make sure Docker containers are running:
```bash
docker-compose ps
```

### OpenAI API errors

Check your API key in `backend/.env`:
```bash
cat backend/.env
```

### Port conflicts

Edit ports in `docker-compose.yml` if 5173 or 8000 are in use

### Hot reload not working

Restart Docker Compose:
```bash
docker-compose down
docker-compose up
```

---

## Benefits of This Migration

### Before (Firebase)
❌ No streaming responses
❌ Long wait times (10-30+ seconds)
❌ Limited to Firebase ecosystem
❌ Cold starts
❌ Function invocation costs

### After (FastAPI + Docker)
✅ **Streaming responses** - see tokens as they generate
✅ **Better UX** - immediate feedback
✅ **Full control** - deploy anywhere
✅ **Local development** - works offline
✅ **Cost effective** - no invocation fees
✅ **Scalable** - easy to horizontally scale

---

## Next Steps

1. **Test locally** - Make sure everything works
2. **Add your OpenAI key** - In `backend/.env`
3. **Test streaming** - See responses appear in real-time
4. **Choose deployment platform** - Cloud Run, Railway, etc.
5. **Deploy** - Follow platform-specific guides

---

## Questions?

- **Docker issues?** See `README.docker.md`
- **API docs?** Visit http://localhost:8000/docs
- **Streaming not working?** Check browser console and backend logs

Congratulations on the migration! 🎉

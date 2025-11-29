# Docker Setup Guide

This guide explains how to run the Task Graph application using Docker.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually comes with Docker Desktop)
- OpenAI API key

## Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 2. Start the Application

Run both frontend and backend with a single command:

```bash
docker-compose up
```

Or run in detached mode (background):

```bash
docker-compose up -d
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (FastAPI automatic documentation)

### 4. Stop the Application

Press `Ctrl+C` in the terminal, or if running in detached mode:

```bash
docker-compose down
```

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload:

- **Frontend**: Changes in `/src` will automatically reload the browser
- **Backend**: Changes in `/backend` will automatically restart the FastAPI server

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild Containers

If you change dependencies or Dockerfiles:

```bash
docker-compose up --build
```

## Architecture

```
┌─────────────────────────────────────────┐
│          Docker Compose                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │   Frontend   │   │    Backend    │  │
│  │              │   │               │  │
│  │  React +     │──▶│  FastAPI +    │  │
│  │  TypeScript  │   │  DSPy Agent   │  │
│  │              │   │               │  │
│  │  Port: 5173  │   │  Port: 8000   │  │
│  └──────────────┘   └───────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## API Endpoints

### Non-Streaming (Backward Compatible)
- `POST /api/chat` - Send a message and get complete response

### Streaming (Better UX)
- `POST /api/chat/stream` - Send a message and receive streaming response via Server-Sent Events

### Health Check
- `GET /` - Check if API is running

## Troubleshooting

### Port Already in Use

If ports 5173 or 8000 are already in use, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Change 8001 to any available port

  frontend:
    ports:
      - "3000:5173"  # Change 3000 to any available port
```

### API Connection Issues

Make sure `VITE_API_URL` in `.env` points to the correct backend URL:

```
VITE_API_URL=http://localhost:8000
```

### OpenAI API Errors

Check that your API key is valid and has credits:

```bash
# View backend logs to see API errors
docker-compose logs backend
```

### Reset Everything

To completely reset (remove containers, volumes, and networks):

```bash
docker-compose down -v
docker-compose up --build
```

## Production Deployment

For production deployment, you'll want to:

1. Build optimized frontend: Update frontend Dockerfile to use production build
2. Use production-grade ASGI server (already using uvicorn)
3. Set up environment variables securely
4. Consider using a reverse proxy (nginx/traefik)
5. Deploy to cloud platform (Google Cloud Run, Railway, Render, etc.)

See deployment guides for your chosen platform.

# School Admission System — AI Agent Documentation

Complete AI-agent handoff documentation for the School Admission System assignment.

## Technology
- Backend: C# ASP.NET Core (.NET 8+)
- Database: PostgreSQL
- Frontend: React 18+ / TypeScript / Vite
- Deployment: Docker Compose

## Required URLs
- Backend API: http://localhost:8080
- Frontend UI: http://localhost:5173

Port 8080 MUST belong to the backend API, not the frontend.

## Run
```bash
docker compose up --build
```

## Documentation
Read `AGENT_INSTRUCTIONS.md` first, then read every file under `docs/`.

Important files:
- ASSUMPTIONS.md
- AI_USAGE.md
- docs/01-PRODUCT-REQUIREMENTS.md
- docs/03-ARCHITECTURE.md
- docs/05-API-CONTRACT.md
- docs/06-CONCURRENCY-AND-SEAT-ALLOCATION.md
- docs/08-TEST-STRATEGY.md
- docs/09-DOCKER-AND-DELIVERY.md
- docs/11-AGENT-ACCEPTANCE-CHECKLIST.md

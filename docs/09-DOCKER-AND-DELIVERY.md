# Docker and Delivery

## Required root files
- docker-compose.yml or compose.yaml
- Backend Dockerfile
- Frontend Dockerfile
- .env.example
- .gitignore
- README.md
- ASSUMPTIONS.md
- AI_USAGE.md

## Compose services
1. PostgreSQL.
2. ASP.NET Core API.
3. React frontend.

Use PostgreSQL health checks and a named persistent volume.

## Host ports
Backend API:
8080:8080
http://localhost:8080

Frontend:
5173:80 or 5173:5173
http://localhost:5173

IMPORTANT:
Never map frontend to host port 8080 in place of the API.

## Verify
```bash
docker compose config
docker compose up --build
```

Verify API, frontend, CORS, and database persistence.

## Submission
- Public GitHub repository if required.
- Meaningful commit history.
- README with setup/run/test instructions.
- Complete ASSUMPTIONS.md.
- Honest AI_USAGE.md.
- No credentials or secrets committed.

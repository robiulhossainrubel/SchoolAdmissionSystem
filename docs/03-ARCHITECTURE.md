# Architecture

## Architecture style
Use a modular monolith.

## Components
1. React frontend.
2. ASP.NET Core Web API.
3. PostgreSQL database.

## Suggested backend layers
- API: controllers, middleware, health checks.
- Application: use cases, DTOs, validation.
- Domain: entities, enums, business rules.
- Infrastructure: EF Core, PostgreSQL, migrations.

## Runtime topology

Browser
  |
  | http://localhost:5173
  v
React Frontend
  |
  | http://localhost:8080
  v
ASP.NET Core API
  |
  v
PostgreSQL

## Port rules
- API: host port 8080.
- Frontend: host port 5173.
- PostgreSQL: internal Docker network; optional development exposure.
- Frontend API base URL: VITE_API_BASE_URL=http://localhost:8080.
- Configure CORS for http://localhost:5173.

IMPORTANT:
Do not map the frontend to host port 8080 instead of the API.

## Reliability
- PostgreSQL health check.
- API health endpoint.
- Named database volume.
- Structured logs.
- Environment-based configuration.

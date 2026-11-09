# Implementation Plan

## Phase 1 — Inspect and scaffold
- Inspect repository and assignment.
- Create solution structure.
- Configure Docker Compose.

## Phase 2 — Domain and database
- Create entities and enums.
- Configure PostgreSQL.
- Add EF Core migrations.
- Add indexes and constraints.

## Phase 3 — Backend
- Implement all required endpoints.
- Implement validation.
- Implement transactional seat allocation.
- Implement expiry, confirmation, cancellation.
- Add error handling and health checks.

## Phase 4 — Testing
- Unit tests.
- API integration tests.
- PostgreSQL concurrency stress test.
- Record actual test results.

## Phase 5 — Frontend
- Parent admission journey.
- Admin offering management.
- API integration.
- Responsive UI and validation.

## Phase 6 — Docker and submission
- Backend and frontend Dockerfiles.
- Compose services.
- Verify API at port 8080.
- Verify frontend at port 5173.
- Complete README and assumptions.
- Review acceptance checklist.
- Commit logical changes.

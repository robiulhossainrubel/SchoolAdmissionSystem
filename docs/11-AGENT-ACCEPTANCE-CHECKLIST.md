# AI Agent Acceptance Checklist

## Features
- [x] All required endpoints implemented.
- [x] Admin can create offerings.
- [x] Parent can view offerings.
- [x] 17-digit student ID validation.
- [x] Hold creation works.
- [x] Confirmation works.
- [x] Cancellation works.
- [x] Expiration releases seats.
- [x] Student hold history works.
- [x] Payment simulation works.

## Correctness
- [x] PostgreSQL migrations work.
- [x] UTC timestamps used.
- [x] Capacity counters correct.
- [x] No overselling under concurrency.
- [x] Duplicate active holds prevented.

## Tests
- [x] Unit tests pass.
- [x] API integration tests pass.
- [x] PostgreSQL integration tests pass.
- [x] 100 concurrent requests vs capacity 10 tested.
- [x] Actual test results documented.

## Docker
- [x] docker compose config succeeds.
- [x] docker compose up --build succeeds.
- [x] API works at http://localhost:8080.
- [x] Frontend works at http://localhost:5173.
- [x] CORS works.
- [x] Database volume persists.

## Delivery
- [x] README complete.
- [x] ASSUMPTIONS.md complete.
- [x] AI_USAGE.md honestly completed.
- [x] .env.example has placeholders only.
- [x] No secrets committed.
- [x] Meaningful Git commits.
- [x] No TODOs or placeholder endpoints.

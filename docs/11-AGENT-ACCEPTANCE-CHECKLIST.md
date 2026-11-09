# AI Agent Acceptance Checklist

## Features
- [ ] All required endpoints implemented.
- [ ] Admin can create offerings.
- [ ] Parent can view offerings.
- [ ] 17-digit student ID validation.
- [ ] Hold creation works.
- [ ] Confirmation works.
- [ ] Cancellation works.
- [ ] Expiration releases seats.
- [ ] Student hold history works.
- [ ] Payment simulation works.

## Correctness
- [ ] PostgreSQL migrations work.
- [ ] UTC timestamps used.
- [ ] Capacity counters correct.
- [ ] No overselling under concurrency.
- [ ] Duplicate active holds prevented.

## Tests
- [ ] Unit tests pass.
- [ ] API integration tests pass.
- [ ] PostgreSQL integration tests pass.
- [ ] 100 concurrent requests vs capacity 10 tested.
- [ ] Actual test results documented.

## Docker
- [ ] docker compose config succeeds.
- [ ] docker compose up --build succeeds.
- [ ] API works at http://localhost:8080.
- [ ] Frontend works at http://localhost:5173.
- [ ] CORS works.
- [ ] Database volume persists.

## Delivery
- [ ] README complete.
- [ ] ASSUMPTIONS.md complete.
- [ ] AI_USAGE.md honestly completed.
- [ ] .env.example has placeholders only.
- [ ] No secrets committed.
- [ ] Meaningful Git commits.
- [ ] No TODOs or placeholder endpoints.

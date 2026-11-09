# MASTER PROMPT — SCHOOL ADMISSION SYSTEM

You are the lead software architect and senior full-stack engineer.

Your task is to implement the COMPLETE School Admission System described in this documentation pack and the original assignment PDF.

Do not stop after planning or scaffolding. Build the complete, working, tested application.

## 1. Before coding
1. Inspect the entire repository.
2. Read this file and every file under `docs/`.
3. Read the original assignment PDF if available.
4. Treat the original assignment as authoritative if a conflict exists.
5. Prepare a short implementation plan.
6. Implement in small, verifiable steps.

## 2. Mandatory technology
- ASP.NET Core Web API using C# and .NET 8 or newer.
- PostgreSQL.
- React 18+ with TypeScript and Vite.
- Docker Compose.
- Automated unit and integration tests.

## 3. Mandatory URLs
Backend API MUST be available at:
`http://localhost:8080`

Frontend UI MUST be available separately at:
`http://localhost:5173`

Configure:
`VITE_API_BASE_URL=http://localhost:8080`

Do not expose the frontend on port 8080 instead of the API.

## 4. Required functionality
Implement:
- Admin class/shift creation.
- Class/shift listing.
- Class/shift details.
- Temporary seat holds.
- Hold status lookup.
- Hold confirmation.
- Hold cancellation.
- Current student's hold listing.
- Seat availability calculation.
- Hold expiration.

## 5. Student identification
There is no parent login screen.

Identify the student using the 17-digit birth registration ID in:
`X-Student-Id`

Validate that it contains exactly 17 digits.

## 6. Admission business rules
- First Come, First Served.
- No lottery.
- Each class/shift has limited capacity.
- A hold temporarily reserves one seat.
- A valid hold expires after the configured duration.
- Default hold duration: 10 minutes.
- Successful confirmation simulates successful payment.
- Expired or cancelled holds release seats.
- Confirmed admissions consume seats.
- Sold-out requests return HTTP 409.

## 7. Critical concurrency requirement
NEVER allow overselling.

Use PostgreSQL transactions and row-level locking, such as SELECT ... FOR UPDATE on the offering row.

Do not rely on:
- In-memory locks.
- SemaphoreSlim alone.
- Application memory counters.
- Counting seats outside a transaction.

Read `docs/06-CONCURRENCY-AND-SEAT-ALLOCATION.md` carefully.

## 8. Code quality
- Use DTOs and validation.
- Use dependency injection.
- Use clean, maintainable architecture.
- Use EF Core migrations or equivalent repeatable database setup.
- Store timestamps in UTC.
- Use consistent error responses.
- Add structured logging.
- Add health checks.
- Keep secrets in environment variables.
- Do not commit real credentials.
- Do not leave TODOs or placeholder endpoints.
- Do not leave non-functional buttons.

## 9. Docker
`docker compose up --build` must start:
1. PostgreSQL
2. Backend API
3. Frontend UI

No host installation of .NET SDK, Node.js, or PostgreSQL should be required.

API host port: 8080.
Frontend host port: 5173.

## 10. Testing
Implement unit tests, API tests, and PostgreSQL-backed integration tests.

Mandatory concurrency test:
- Offering capacity = 10.
- Send 100 simultaneous hold requests.
- Use 100 distinct student IDs.
- Exactly 10 requests should succeed.
- Remaining requests should receive 409.
- Verify database state never exceeds capacity.

## 11. Git
Create meaningful commits for logical implementation stages.

## 12. Final report
Report:
- Features implemented.
- Architecture.
- Database design.
- API endpoints.
- Commands executed.
- Actual test results.
- Docker startup result.
- Known limitations.
- Exact frontend and API URLs.

Never claim that a test passed unless it was actually executed.

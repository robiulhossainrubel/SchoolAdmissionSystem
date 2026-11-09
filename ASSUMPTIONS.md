# Assumptions & Architecture Decisions

This document records all implementation decisions, defaults, and architectural trade-offs where the assignment brief left details open to engineering judgment.

---

## 1. Concurrency & Multi-Process Safety (Bonus Requirement §1.6)

### How Multi-Process Concurrency Safety is Guaranteed
- **The Challenge**: The assignment requested proof that two separate backend processes running on different ports (e.g., port 8080 and port 8081) against the same database concurrently never violate Rule 1 (`heldSeats + confirmedSeats <= totalSeats`).
- **Why In-Memory Locks Fail**: In-memory constructs (e.g., `lock`, `Monitor`, `SemaphoreSlim`, or application-level counters) only coordinate threads within a single operating system process. When two or more API instances run independently, in-memory synchronizers are completely unaware of one another.
- **Our Database-Level Solution**:
  1. Competing hold requests begin an explicit PostgreSQL transaction with `IsolationLevel.ReadCommitted`.
  2. The application acquires an exclusive pessimistic row lock on the target class offering row using:
     ```sql
     SELECT * FROM admission_classes WHERE id = @classId FOR UPDATE;
     ```
  3. PostgreSQL serializes all competing transactions for that specific offering row at the database engine level across any number of backend processes, containers, or host machines.
  4. Active reservations are counted in a single atomic SQL aggregation query:
     ```sql
     SELECT COUNT(*) FROM admission_holds 
     WHERE class_id = @classId AND (status = 'CONFIRMED' OR (status = 'HELD' AND expires_at_utc > @nowUtc));
     ```
  5. If the count reaches capacity, the transaction rolls back and returns `HTTP 409 Conflict`.
  6. Verified by firing 100 simultaneous requests split equally across two independent backend processes (Port 8080 and Port 8081) targeting an offering with capacity 10: exactly 10 succeeded (201 Created), 90 were rejected (409 Conflict), and exactly 10 rows were persisted in PostgreSQL.

---

## 2. Student Identity & Authentication
- **No Password Authentication**: The assignment specifies that no parent login screen is required.
- **Identification Mechanism**: Student identity is conveyed strictly via the `X-Student-Id` HTTP header.
- **Format Validation**: Must consist of exactly 17 numeric digits (`^\d{17}$`). Missing, malformed, or non-17-digit headers return `HTTP 400 Bad Request`.
- **UI Persistence**: The student ID is persisted in client `localStorage` (`sas_student_id`) so page refreshes and reopened browser sessions retain the active student session.

---

## 3. Hold Expiration & Capacity Reclamation
- **Configurable Duration**: The hold validity duration is read from environment variable `HOLD_DURATION_SECONDS` with a default of 600 seconds (10 minutes).
- **Zero-Latency Return**: Seats automatically return to available capacity the instant `expires_at_utc <= nowUtc` without requiring background workers or external API calls. The seat availability formulas and transactional lock handlers dynamically treat past holds as expired.
- **Lazy Database Cleanup**: During hold creation, expired records for that offering are updated to `EXPIRED` status in PostgreSQL for operational auditing.

---

## 4. Single Active Hold per Student per Offering
- **Policy**: A student cannot have more than one active reservation (`HELD`) or confirmed admission (`CONFIRMED`) in the same class offering simultaneously.
- **Behavior**: Duplicate attempts for the same offering return `HTTP 409 Conflict`.
- **Cross-Offering Freedom**: A student may apply to different class/shift offerings if desired, but cannot hold duplicate seats in the same shift.

---

## 5. Idempotent Confirmation & Cancellation
- **Simulated Payment**: Calling `POST /holds/{holdId}/confirm` simulates successful payment and transitions status to `CONFIRMED`.
- **Idempotency**: Repeated calls to `/confirm` on an already confirmed hold return `HTTP 200 OK` without incrementing capacity multiple times.
- **Ownership Verification**: Holds record the owning `student_id`. Attempts to confirm or cancel another student's hold return `HTTP 403 Forbidden`.
- **Confirmed Seat Protection**: A hold with status `CONFIRMED` cannot be cancelled via `DELETE /holds/{holdId}` (returns `HTTP 409 Conflict`).

---

## 6. School Admin Dashboard Scope
- **Evaluation Demo Mode**: The assignment brief does not define admin credentials, roles, or password authentication.
- **Implementation**: The School Admin panel is accessible via a dedicated navigation tab in the React UI for evaluation convenience.
- **Production Disclaimer**: Clearly documented in UI and code that in a production deployment, admin operations (`POST /classes`) must be secured behind role-based access control (RBAC), ASP.NET Core Identity, or OAuth2 / OpenID Connect tokens.

---

## 7. Port Allocation Standard
- **Backend API**: `http://localhost:8080`
- **Frontend UI**: `http://localhost:5173`
- **Frontend API Base URL**: `VITE_API_BASE_URL=http://localhost:8080`
- **Host Port Integrity**: Frontend container binds strictly to host port 5173 (via Nginx on container port 80). Host port 8080 is reserved exclusively for the ASP.NET Core Web API.

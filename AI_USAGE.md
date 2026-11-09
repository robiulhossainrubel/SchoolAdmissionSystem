# AI Usage Record

In strict adherence to academic and professional integrity requirements, this document records how AI tools were used during the design, development, and verification of the School Admission System.

---

## 1. AI Tools Used
- **Agentic AI Coding Assistant**: Google DeepMind Antigravity / Gemini 3.8 Flash (Autonomous agent running in supervised pair-programming mode).

---

## 2. Specific Uses of AI
1. **Requirement Analysis & Specification**:
   - Extracted and analyzed requirements from `Asst_Software_Engineer_Project_Assignment.pdf` (written in Bengali and English).
   - Produced the comprehensive [REQUIREMENT_ANALYSIS_AND_PLAN.md](REQUIREMENT_ANALYSIS_AND_PLAN.md) document detailing all 16 architectural areas and the Requirement Traceability Matrix.
2. **Architecture & Database Design**:
   - Formulated the Clean Architecture modular structure (`Domain`, `Application`, `Infrastructure`, `Api`, `Tests`).
   - Defined EF Core model configurations with check constraints (`total_seats > 0`, `length(student_id) = 17`), composite indexes, and UTC `timestamptz` types.
3. **Concurrency & Seat Allocation Engineering**:
   - Engineered the PostgreSQL row-level pessimistic locking strategy (`SELECT ... FOR UPDATE` on `admission_classes`).
   - Discovered and eliminated a subtle race condition in dual-count aggregation by designing a single atomic SQL filter query.
4. **Automated Testing Suite**:
   - Generated unit tests, WebApplicationFactory API integration tests, and the mandatory 100-request parallel concurrency stress test against real PostgreSQL.
5. **Frontend SPA Implementation**:
   - Implemented React 18+ TypeScript application with live periodic polling (4s interval), reactive countdown timer with instant zero-reload auto-expiration, and student session persistence.

---

## 3. Errors Caught & Corrected During Development
1. **.NET Host vs Target Runtime Discrepancy**:
   - *Issue*: Host machine had .NET 10 SDK preview installed without older .NET 8 runtime packs.
   - *Fix*: Configured `<RollForward>Major</RollForward>` in `Directory.Build.props` so that the project targets standard `.NET 8` for Docker deployment while rolling forward seamlessly during host builds.
2. **System.Text.Json PipeWriter.UnflushedBytes Exception**:
   - *Issue*: During WebApplicationFactory testing on the preview runtime, `System.Text.Json` threw `PipeWriterDoesNotImplementUnflushedBytes` when serializing through the TestHost pipe.
   - *Fix*: Implemented a clean `StreamJsonOutputFormatter` writing directly to `HttpResponse.Body` (Stream), resolving the issue across all runtimes.
3. **Dual-Query Aggregation Race Condition**:
   - *Issue*: In high-frequency hold-and-confirm stress testing, querying `Count(CONFIRMED)` followed by a separate `Count(HELD)` allowed a hold undergoing concurrent confirmation to slip between queries.
   - *Fix*: Unified the calculation into a single atomic aggregation query and established hierarchical row-locking (class row locked before hold row).
4. **Npgsql Connection Pool Exhaustion under 100 Parallel Requests**:
   - *Issue*: 100 concurrent HTTP requests fired at the exact same millisecond initially exceeded PostgreSQL's default `max_connections = 100`.
   - *Fix*: Configured Npgsql connection string with `Maximum Pool Size=60;Timeout=30`, enabling orderly connection pooling without server-side connection exhaustion.

---

## 4. Human Review & Verification
- Every implementation phase was supervised and explicitly approved before proceeding.
- All code changes were committed incrementally with conventional Git commits.
- Actual test suites were executed on live Docker and PostgreSQL environments with real outputs captured.

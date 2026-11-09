# School Admission System

A robust, concurrent School Admission System with temporary seat reservations (holds), admission confirmation with simulated payment, and live seat tracking.

## Technology Stack
- **Backend API**: ASP.NET Core Web API (.NET 8)
- **Database**: PostgreSQL 16
- **Frontend UI**: React 18+ / TypeScript / Vite
- **Containerization**: Docker Compose

---

## Network Architecture & Mandatory URLs
- **Backend API**: `http://localhost:8080`
- **Frontend UI**: `http://localhost:5173`
- **Frontend API Base URL**: `VITE_API_BASE_URL=http://localhost:8080`

> [!NOTE]
> Backend API is hosted on port 8080 and Frontend UI is hosted on port 5173. Port 8080 belongs strictly to the backend API.

---

## Quick Start with Docker (Recommended)

To start PostgreSQL, backend API, and frontend UI in a single command without requiring any host installations:

```bash
docker compose up --build
```

- Access the Frontend UI: [http://localhost:5173](http://localhost:5173)
- Access the Backend Health Check: [http://localhost:8080/health](http://localhost:8080/health)

To tear down containers while preserving the database volume:
```bash
docker compose down
```

---

## Local Development (Without Docker)

### Prerequisites
- [.NET 8+ SDK](https://dotnet.microsoft.com/)
- [Node.js 20+](https://nodejs.org/) & npm
- [PostgreSQL 16](https://www.postgresql.org/)

### 1. Backend Setup
```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/SchoolAdmission.Api
```
The API will start at `http://localhost:8080`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The UI will start at `http://localhost:5173`.

### 3. Running Automated Tests

#### Backend Test Suite (30 Tests)
```bash
dotnet test backend/SchoolAdmissionSystem.sln
```

#### Frontend Test Suite (19 Tests)
```bash
cd frontend
npm test
```

#### All-in-One Automated System Audit (PowerShell)
```powershell
pwsh scripts/verify-all.ps1
```

---

## Environment Variables

Copy `.env.example` to `.env` if custom overrides are needed:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `school_admission` | PostgreSQL database name |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `HOLD_DURATION_SECONDS` | `600` | Temporary seat hold validity duration (in seconds) |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for frontend |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API base URL consumed by Vite frontend |

---

## Project Structure

```
SchoolAdmissionSystem/
├── .env.example
├── docker-compose.yml
├── README.md
├── AGENTS.md
├── ASSUMPTIONS.md
├── docs/                                  # Architecture and specification docs
├── backend/
│   ├── Dockerfile
│   ├── Directory.Build.props
│   ├── SchoolAdmissionSystem.sln
│   ├── src/
│   │   ├── SchoolAdmission.Domain/        # Domain entities, enums, rules
│   │   ├── SchoolAdmission.Application/   # Use cases, DTOs, service interfaces
│   │   ├── SchoolAdmission.Infrastructure/# EF Core, PostgreSQL persistence
│   │   └── SchoolAdmission.Api/           # Controllers, filters, Program.cs
│   └── tests/
│       └── SchoolAdmission.Tests/         # Unit, integration & concurrency tests
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── .env.example
    ├── .env
    └── src/                               # React + TS application source
```

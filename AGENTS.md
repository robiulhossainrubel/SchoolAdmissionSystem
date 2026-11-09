# School Admission System — Workspace Rules

## Mandatory instructions
1. Before coding, read AGENT_INSTRUCTIONS.md.
2. Read every document inside docs/.
3. Read the original assignment PDF.
4. The original assignment is authoritative.
5. Follow the approved implementation plan.
6. Never skip a phase without user approval.

## Technology
- Backend: ASP.NET Core Web API, C#, .NET 8+
- Database: PostgreSQL
- ORM: Entity Framework Core
- Frontend: React 18+, TypeScript, Vite
- Deployment: Docker Compose

## Network contract
- Backend API: http://localhost:8080
- Frontend UI: http://localhost:5173
- Frontend API base URL: VITE_API_BASE_URL
- Never swap the API and frontend ports.

## Critical business rule
Never oversell seats.

Use PostgreSQL transactions and row-level locking
or an equivalently proven database-level atomic strategy.

Never rely only on in-memory locks or counters.

## Supervised development rules
- First analyze; do not code before approval.
- Work on one implementation phase at a time.
- Before each phase, explain the planned changes.
- Wait for explicit user approval.
- After each phase, build and run relevant tests.
- Show changed files and test results.
- Stop when approval is required.
- Never silently proceed to the next phase.
- Never run destructive commands without permission.
- Never delete user data or existing project files without approval.
- Never fabricate test results.
- Never commit secrets.

## Git rules
- Use meaningful commits after approved phases.
- Never force-push.
- Never reset or rewrite existing history without approval.
- Keep all work on the project branch.

## Completion
Do not claim completion until the acceptance checklist passes.
Document every incomplete requirement.
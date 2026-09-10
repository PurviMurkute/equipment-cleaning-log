# Equipment Cleaning Log

Live full-stack submission for the CLEEN take-home assignment. The application manages equipment records, cleaning records, and field-level audit history for each cleaning record. It uses a Node.js + TypeScript + Express API with PostgreSQL and a React + TypeScript frontend connected through Axios.

## Demo

- Live Application: [https://equipment-cleaning-log.netlify.app/](https://equipment-cleaning-log.netlify.app/)
- GitHub Repository: [https://github.com/PurviMurkute/equipment-cleaning-log](https://github.com/PurviMurkute/equipment-cleaning-log)

## Features

- Equipment CRUD
- Cleaning record creation, update, and listing
- Pagination for cleaning records
- Status filtering for cleaning records
- Field-level audit trail
- Audit history per cleaning record
- React frontend connected to the backend
- Minimal, responsive UI
- Automated backend tests for audit diff, pagination, and status filtering

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

Backend:
- Node.js
- TypeScript
- Express
- PostgreSQL
- pg with raw parameterized SQL

Database:
- PostgreSQL
- The current repository is configured for an Aiven PostgreSQL instance

Testing:
- Node.js built-in `node:test`
- `tsx`

## Architecture

The backend follows a simple flow:

`Route -> Controller -> Service -> PostgreSQL`

- Routes define the HTTP endpoints.
- Controllers validate requests and shape responses.
- Services contain the business logic and SQL queries.
- DTOs provide typed request and response structures.
- Database access uses parameterized SQL through `pg`.

The frontend is organized around:

- Pages for each route
- Reusable components for dialogs, tables, and layout
- A small API/service layer for backend calls
- Shared TypeScript types for data consistency

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/equipment` | List all equipment |
| GET | `/api/equipment/:id` | Get a single equipment record |
| POST | `/api/equipment` | Create a new equipment record |
| PATCH | `/api/equipment/:id` | Update an equipment record |
| DELETE | `/api/equipment/:id` | Delete an equipment record |
| POST | `/api/equipment/:equipmentId/cleaning-records` | Create a cleaning record for a specific equipment item |
| GET | `/api/equipment/:equipmentId/cleaning-records` | List cleaning records for a specific equipment item with pagination and optional status filtering |
| PATCH | `/api/cleaning-records/:id` | Update a cleaning record |
| GET | `/api/cleaning-records/:id/audit-history` | Fetch the audit history for a cleaning record |

Cleaning record listing supports the following query parameters:

- `page`
- `limit`
- `status`

Example:

```text
GET /api/equipment/:equipmentId/cleaning-records?page=1&limit=10&status=PENDING
```

## Audit Trail

Audit history is created whenever a cleaning record is created or updated.

- Create operations generate initial audit entries for the tracked fields.
- Update operations compare old and new values.
- Only changed fields generate audit entries.
- Each audit entry stores `field`, `oldValue`, `newValue`, `changedBy`, and `changedAt`.
- Record updates and audit inserts run inside a PostgreSQL transaction.

Example:

```text
method: CIP -> Manual Wash
changedBy: Ravi Kumar
```

`changedBy` is explicitly supplied by the current frontend because authentication was outside the required scope.

## Pagination and Filtering

Cleaning records use offset pagination on the backend.

Example:

```text
GET /api/equipment/:equipmentId/cleaning-records?page=1&limit=10&status=VERIFIED
```

The response includes:

- `data`
- `pagination.page`
- `pagination.limit`
- `pagination.total`
- `pagination.totalPages`

## Project Structure

```text
equipment-cleaning-log/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- dto/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- app.ts
|   |   `-- index.ts
|   `-- tests/
`-- frontend/
    |-- src/
    |   |-- components/
    |   |-- lib/
    |   |-- pages/
    |   |-- services/
    |   `-- ...
    `-- public/
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- PostgreSQL database access

### Backend

```bash
cd backend
npm install
```

Create or update `backend/.env` with the variables used by the backend:

```env
PORT=5000
DATABASE_URL=postgresql://...
# or alternatively:
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

Run the backend:

```bash
npm run dev
```

Build the backend:

```bash
npm run build
```

### Frontend

```bash
cd frontend
npm install
```

Set the API base URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Database Setup

The backend uses raw SQL against PostgreSQL tables for `Equipment`, `CleaningRecord`, and `AuditEntry`.

This repository does not include SQL migration files or a seed script, so make sure your PostgreSQL database already has the required schema before running the app or tests.

The backend tests reset and seed their own test data using the live database connection.

## Tests

Run the backend test suite with:

```bash
cd backend
npm test
```

The tests cover:

- audit diff generation
- unchanged updates not creating duplicate audit entries
- pagination metadata
- status filtering

## Design Decisions / Assumptions

- Raw parameterized SQL was used instead of an ORM.
- UUID v4 identifiers are generated in the application.
- Offset pagination was used for the cleaning-record list endpoint.
- Authentication was kept outside the core scope.
- `changedBy` is supplied by the client because authentication is not implemented.
- Audit updates run inside a PostgreSQL transaction.

## Limitations / Out of Scope

- Authentication was not implemented because it was outside the core required scope.
- Docker support was not added.
- No dedicated dashboard analytics API was added; the dashboard is derived from available backend data.
- No SQL migration or seed files are included in this repository.

Thank you for reviewing this submission.

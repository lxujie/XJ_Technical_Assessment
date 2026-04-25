# Real-Time Data Manager

A full-stack TypeScript application built with React, Node.js (Express), and PostgreSQL. This project features robust CSV processing, highly responsive search and pagination, and an event-driven architecture using WebSockets for real-time collaborative conflict resolution.

## Prerequisites

- **Docker** and **Docker Compose** must be installed and running on your machine.

## Getting Started

1. Clone this repository and navigate to the root directory.
2. Build and start the containers using Docker Compose:

```bash
docker compose up --build
```

3. Once the containers are running, access the application:

- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:3000`

> Note: To completely wipe the database and start fresh, run `docker compose down -v` followed by `docker compose up --build`.

## Feature Demo Guide

Included in the root directory are three test files:

- `data.csv` — the baseline
- `conflict_data.csv` — modified records to trigger conflicts
- `empty.csv` — to test edge cases

### Testing Real-Time Collaboration & Conflict Resolution

To see the WebSocket architecture in action, follow these steps:

1. Open two separate browser windows side-by-side (for example, two Chrome windows, or Chrome and Firefox) and navigate to `http://localhost:5173` in both.
2. In Window A, upload the original `data.csv`. Both windows will instantly populate with the data.
3. In Window A, upload `conflict_data.csv`.
4. The backend will detect the data collision and fire a `conflict_detected` event only to Window A. A diff modal will appear showing the exact changes highlighted in red. Window B remains uninterrupted.
5. In Window A, click **"Overwrite with New CSV"**.
6. Watch Window B. The table will automatically update to reflect the new data in milliseconds without any manual page refresh.

## Architecture & Design Decisions

This application was built with a focus on edge-case handling, data integrity, and scalable UX.

1. Targeted WebSocket Emissions: When a user uploads a file, their unique `socket.id` is bundled with the HTTP POST request. This allows the server to isolate the Conflict Resolution UI to the specific user who caused the conflict, rather than broadcasting it globally and interrupting other active users.
2. Smart Conflict Detection: Instead of blindly flagging an upload just because an ID already exists, the backend logic intelligently diffs the incoming CSV values against the existing PostgreSQL records. It only interrupts the user if the data was actually modified.
3. ACID Compliant Transactions: The CSV upload pipeline wraps all database inserts in strict `BEGIN`, `COMMIT`, and `ROLLBACK` blocks. If a batch contains a malformed row that violates database constraints, the entire batch is rejected, completely preventing partial or corrupted data states.
4. Aggressive Data Sanitization: The backend parser utilizes regex (`/[^a-zA-Z0-9]/g`) to aggressively strip out invisible Byte Order Marks (BOMs), erratic spaces, and literal quotes from incoming CSV headers, ensuring a bulletproof mapping to the database schema regardless of the export software used.
5. Debounced Search: The React frontend utilizes a custom `useDebounce` hook (500ms). This protects the PostgreSQL database from being hammered by expensive `ILIKE` queries on every single keystroke while the user types.

## Running Unit Tests

The backend includes a Jest/Supertest suite designed to catch production edge cases (for example, negative pagination values, empty files, and SQL constraint rollback verification).

To run the tests locally:

1. Open a terminal and navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Run the test suite:

```bash
npm test
```

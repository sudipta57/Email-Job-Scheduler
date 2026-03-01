# ReachInBox Email Scheduler

A full-stack email scheduling platform that lets users compose, schedule, and track outbound emails with support for bulk sends, rate limiting, and persistent job queues.

---

## Tech Stack

| Layer    | Technologies                                                        |
| -------- | ------------------------------------------------------------------- |
| Backend  | TypeScript, Express 5, BullMQ, Redis, Prisma, PostgreSQL, Nodemailer |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4                    |
| Infra    | Docker Compose (PostgreSQL 16, Redis 7)                             |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Docker** & **Docker Compose**

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/reachinbox-scheduler.git
cd reachinbox-scheduler
```

### 2. Start infrastructure services

```bash
docker compose up -d
```

This starts **PostgreSQL** on port `5432` and **Redis** on port `6379`.

### 3. Backend setup

```bash
cd backend
cp .env.example .env   # then fill in the values (see Environment Variables)
npm install
npx prisma migrate dev
npm run dev             # starts on http://localhost:4000
```

### 4. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev             # starts on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Description                                       | Default              |
| --------------------- | ------------------------------------------------- | -------------------- |
| `PORT`                | Express server port                               | `4000`               |
| `DATABASE_URL`        | PostgreSQL connection string                      | —                    |
| `REDIS_URL`           | Redis connection string                           | `redis://localhost:6379` |
| `GOOGLE_CLIENT_ID`    | Google OAuth 2.0 Client ID                        | —                    |
| `GOOGLE_CLIENT_SECRET`| Google OAuth 2.0 Client Secret                    | —                    |
| `SESSION_SECRET`      | Secret for express-session cookies                | —                    |
| `ETHEREAL_USER`       | Ethereal SMTP username (fake mail)                | —                    |
| `ETHEREAL_PASS`       | Ethereal SMTP password (fake mail)                | —                    |
| `MAX_EMAILS_PER_HOUR` | Rate limit — max emails per sender per hour       | `200`                |
| `WORKER_CONCURRENCY`  | Number of concurrent BullMQ worker threads        | `5`                  |
| `EMAIL_DELAY_MS`      | Artificial delay (ms) between sends in the worker | `2000`               |

### Frontend (`frontend/.env.local`)

| Variable              | Description                | Default                   |
| --------------------- | -------------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL       | `http://localhost:4000`   |

---

## Architecture Overview

```
┌─────────┐       POST /api/emails/schedule        ┌──────────┐
│ Next.js │ ────────────────────────────────────▶  │ Express  │
│ Client  │                                        │ API      │
└─────────┘                                        └────┬─────┘
                                                        │
                                      1. Save to DB     │  2. Add delayed job
                                     ┌──────────────┐   │   ┌───────────┐
                                     │  PostgreSQL   │◀──┴──▶│  BullMQ   │
                                     │  (Prisma)     │       │  (Redis)  │
                                     └──────┬───────┘       └─────┬─────┘
                                            │                     │
                                            │  3. Worker picks    │
                                            │     job at delay    │
                                            │                     ▼
                                            │              ┌─────────────┐
                                            │              │   Worker    │
                                            │              │ (BullMQ)    │
                                            │              └──────┬──────┘
                                            │                     │
                                            │  4. Update status   │  5. Send via
                                            │◀────────────────────│     Nodemailer
                                            │                     ▼
                                            │              ┌─────────────┐
                                            │              │  Ethereal   │
                                            │              │  SMTP       │
                                            │              └─────────────┘
```

### Scheduling Flow

1. Client sends a `POST /api/emails/schedule` request with recipient, subject, body, sender, and `scheduledAt` timestamp.
2. The API creates an `Email` record in PostgreSQL (status `PENDING`).
3. A BullMQ delayed job is added to the `email-queue` in Redis with a delay equal to `scheduledAt - now`.
4. When the delay expires, the **Worker** picks up the job and sends the email via Nodemailer.
5. The DB record is updated to `SENT` (or `FAILED` on error).

### Persistence on Restart

- BullMQ jobs are stored in **Redis** with AOF/RDB persistence. If the server restarts, delayed jobs survive and are processed once the worker reconnects.
- The worker performs an **idempotency check**: before sending, it reads the DB record and skips if the status is already `SENT`, preventing duplicate deliveries.

### Rate Limiting

- Uses a **Prisma-backed counter** keyed by `sender + hourWindow` (`YYYY-MM-DD-HH`).
- Before sending, the worker reads the current count. If it meets or exceeds `MAX_EMAILS_PER_HOUR`, the job is **re-enqueued** with a delay until the start of the next hour.
- The counter is atomically incremented via Prisma `upsert` before each successful send.

### Concurrency

- Configurable via the `WORKER_CONCURRENCY` environment variable (default `5`).
- BullMQ processes up to that many jobs in parallel within a single worker instance.

### Delay Between Emails

- Configurable via the `EMAIL_DELAY_MS` environment variable (default `2000` ms).
- Each worker invocation `await`s this delay before calling `sendMail`, throttling throughput.

---

## Features Implemented

### Backend

- **Job scheduling** — schedule individual emails at a future date/time via delayed BullMQ jobs.
- **Persistence** — jobs survive server/Redis restarts; worker resumes processing automatically.
- **Rate limiting** — per-sender, per-hour limit with automatic rescheduling to the next window.
- **Concurrency** — configurable parallel job processing.
- **Idempotency** — DB status check prevents duplicate sends on retries.
- **Bulk scheduling** — schedule many emails in one request with configurable inter-email delay.
- **Google OAuth** — Passport.js strategy for Google sign-in.

### Frontend

- **Google OAuth login** — redirects to Google and back to the dashboard.
- **Dashboard** — overview page after authentication.
- **Scheduled tab** — view all pending/scheduled emails.
- **Sent tab** — view delivered and failed emails.
- **Compose page** — form to schedule a single email.
- **CSV upload** — bulk schedule emails by uploading a CSV.
- **Email detail view** — inspect an individual email's status and metadata.

---

## API Endpoints

| Method | Path                         | Description                              |
| ------ | ---------------------------- | ---------------------------------------- |
| `GET`  | `/health`                    | Health check                             |
| `GET`  | `/auth/google`               | Initiate Google OAuth flow               |
| `GET`  | `/auth/google/callback`      | Google OAuth callback                    |
| `GET`  | `/auth/me`                   | Get current authenticated user           |
| `POST` | `/auth/logout`               | Log out the current session              |
| `POST` | `/api/emails/schedule`       | Schedule a single email                  |
| `POST` | `/api/emails/schedule-bulk`  | Schedule emails in bulk                  |
| `GET`  | `/api/emails/scheduled`      | List all pending/scheduled emails        |
| `GET`  | `/api/emails/sent`           | List all sent/failed emails              |
| `GET`  | `/api/emails/:id`            | Get a single email by ID                 |

---

## Trade-offs & Assumptions

| Area                  | Notes                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **SMTP provider**     | Uses [Ethereal](https://ethereal.email/) — a fake SMTP service. Emails are captured but never delivered to real inboxes.               |
| **Authentication**    | Only Google OAuth is fully wired end-to-end. The email/password login form on the frontend is **UI-only** and does not hit a real auth endpoint. |
| **Session storage**   | Express sessions are stored in-memory (default `MemoryStore`). Not suitable for production — swap to `connect-redis` or similar.       |
| **Rate limit store**  | Rate limit counters live in PostgreSQL via Prisma. For higher throughput consider migrating to Redis `INCR` with TTL.                  |
| **Single worker**     | One worker process runs inside the API server. For horizontal scaling, run workers as separate processes.                              |
| **No email templates**| Email body is raw HTML passed by the client. No server-side template engine is used.                                                   |
| **CORS**              | Hardcoded to `http://localhost:3000`. Update for production deployments.                                                                |

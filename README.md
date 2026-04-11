# Secrets Rotation Manager

A monorepo application for managing and automatically rotating application secrets (API keys, database passwords, tokens, etc.) and delivering the new values to the services that need them.

## Architecture

```
apps/
  api/        → Express REST API (port 3000)
  web/        → React dashboard (Vite, port 5173)
  scheduler/  → Cron job that queues due secrets for rotation
  rotator/    → Queue worker that rotates secrets + delivers to targets

packages/
  database/   → Shared MongoDB models & queries (Mongoose)
  queue/      → Redis queue using ioredis (LPUSH / BRPOP)
```

## How It Works

```
  ┌───────┐         ┌──────────┐        ┌─────────────┐        ┌─────────┐
  │  API  │─create──▶ MongoDB  │◀──read──│  Scheduler  │──push──▶  Redis  │
  │       │─rotate──▶  Queue   │         │  (cron job) │        │  Queue  │
  └───────┘         └──────────┘        └─────────────┘        └────┬────┘
                         ▲                                          │
                         │               ┌─────────┐               │
                         └───update──────│ Rotator  │◀───consume────┘
                                         │ (worker) │
                                         └────┬────┘
                                              │
                            ┌─────────────────┼─────────────────┐
                            ▼                 ▼                 ▼
                       ┌─────────┐     ┌───────────┐     ┌──────────┐
                       │ Webhook │     │  AWS SSM   │     │ Env File │
                       │ targets │     │  targets   │     │ targets  │
                       └─────────┘     └───────────┘     └──────────┘
```

### Rotation Flow

1. The **Scheduler** runs a cron job every minute, finds secrets past their rotation date, marks them as `rotating`, and pushes them to the Redis queue
2. The **Rotator** picks up the job and uses the secret's **provider strategy** to generate a new value:
   - `generic` — random 32-byte hex string
   - `database` — connects to the database and changes the user's password
   - `custom-api` — calls an external API (e.g. Stripe, AWS) that returns the new credential
3. The **Rotator** saves the new value in MongoDB
4. The **Rotator** delivers the new value to every **target** defined on the secret:
   - `webhook` — POST the new value to a URL (e.g. `http://backend:8080/config/reload`)
   - `aws-ssm` — write to AWS Systems Manager Parameter Store
   - `env-file` — update a key in a `.env` file on disk
5. A **Rotation Log** entry is created with the result

### Manual Rotation

The **API** and **Dashboard** also support triggering rotation on-demand by pushing a job to the same Redis queue.

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker (for MongoDB + Redis)

### Quick Start

```bash
# 1. Start MongoDB & Redis
docker compose up -d

# 2. Install dependencies
npm install

# 3. Start all services
npm run demo
```

Open `http://localhost:5173` — the dashboard is ready.

### Demo Walkthrough

1. **Load demo data**: Click **"Load Demo"** in the top-right corner — 4 sample secrets are created, 2 of them overdue
2. **Auto-rotation**: Wait ~60s — the scheduler picks up the overdue secrets, rotates them, and delivers to the test webhook
3. **Manual rotation**: Click "Rotate" on any secret — rotation happens instantly
4. **Create a secret**: Click "+ Add Secret", pick a provider, add a webhook target
5. **Check deliveries**: The "Webhook Deliveries (Live)" panel shows every POST received
6. **Reset**: Click **"Clear All"** to wipe everything and start fresh

## API Endpoints

| Method | Endpoint                | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| GET    | /api/secrets            | List all secrets (values masked)    |
| POST   | /api/secrets            | Create a new secret                 |
| GET    | /api/secrets/:id        | Get a single secret                 |
| PUT    | /api/secrets/:id        | Update secret metadata              |
| DELETE | /api/secrets/:id        | Delete a secret                     |
| POST   | /api/secrets/:id/rotate | Queue a manual rotation job         |
| GET    | /api/secrets/:id/logs   | Get rotation logs for a secret      |
| GET    | /api/logs               | Get all rotation logs               |

### Creating a Secret with Provider & Targets

```json
POST /api/secrets
{
  "name": "DATABASE_PASSWORD",
  "service": "database",
  "value": "initial-password",
  "rotationIntervalDays": 7,
  "provider": "database",
  "providerConfig": {
    "connectionUri": "postgresql://admin:pass@localhost:5432/myapp",
    "dbUser": "app_user"
  },
  "targets": [
    {
      "type": "webhook",
      "label": "Backend API",
      "config": { "url": "http://backend:8080/config/reload" }
    },
    {
      "type": "env-file",
      "label": "Backend .env",
      "config": { "path": "/app/.env", "key": "DB_PASSWORD" }
    }
  ]
}
```

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Backend**: Express 5, Node.js
- **Database**: MongoDB + Mongoose
- **Queue**: Redis + ioredis
- **Frontend**: React 19 + Vite
- **Scheduling**: node-cron

# Secrets Rotation Manager

A monorepo application for managing and automatically rotating application secrets (API keys, database passwords, tokens, etc.).

## Architecture

```
apps/
  api/        → Express REST API (port 3000)
  web/        → React dashboard (Vite, port 5173)
  scheduler/  → Cron job that queues due secrets for rotation
  rotator/    → Queue worker that processes rotation jobs

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
                                         └─────────┘
```

1. The **API** stores secrets in MongoDB. Manual rotation requests are pushed to a Redis list
2. The **Scheduler** runs a cron job every minute, finds secrets past their rotation date, marks them as `rotating`, and pushes them to the Redis list
3. The **Rotator** is a long-running worker that blocks on `BRPOP`, picks up jobs from the list, generates a new secret value, updates MongoDB, and logs the rotation
4. The **Web Dashboard** polls the API every 5 seconds to show live secret status and rotation history

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB running locally
- Redis running locally

### Install

```bash
npm install
```

### Run

```bash
# Seed demo data, then start all services (API + Web + Scheduler + Rotator)
npm run demo
```

The web dashboard will be at `http://localhost:5173`.

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

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Backend**: Express 5, Node.js
- **Database**: MongoDB + Mongoose
- **Queue**: Redis + ioredis
- **Frontend**: React 19 + Vite
- **Scheduling**: node-cron

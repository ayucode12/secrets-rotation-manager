# Secrets Rotation Manager

A monorepo application for managing and automatically rotating application secrets (API keys, database passwords, tokens, etc.) and delivering the new values to the services that need them.

## Architecture

```
apps/
  api/        → Express REST API (port 3000)
  web/        → React dashboard (Vite, port 5173)
  scheduler/  → Polls for due secrets and queues them for rotation
  rotator/    → Queue worker that rotates secrets + delivers to targets

packages/
  database/   → Shared MongoDB models & queries (Mongoose)
  queue/      → Redis queue using ioredis (LPUSH / BRPOP)
```

## How It Works

```
  ┌───────┐         ┌──────────┐        ┌─────────────┐        ┌─────────┐
  │  API  │─create──▶ MongoDB  │◀──read──│  Scheduler  │──push──▶  Redis  │
  │       │─rotate──▶  Queue   │         │  (polling)  │        │  Queue  │
  └───────┘         └──────────┘        └─────────────┘        └────┬────┘
                         ▲                                          │
                         │               ┌─────────┐               │
                         └───update──────│ Rotator  │◀───consume────┘
                                         │ (worker) │
                                         └────┬────┘
                                              │
                                         ┌─────────┐
                                         │ Webhook │
                                         │ target  │
                                         └─────────┘
```

### Rotation Flow

1. The **Scheduler** polls every 15 seconds (configurable via `POLL_INTERVAL_MS`), finds secrets past their rotation date, marks them as `rotating`, and pushes them to the Redis queue
2. The **Rotator** picks up the job and uses the secret's **provider strategy** to generate a new value:
   - `generic` — random 32-byte hex string
   - `custom-api` — calls an external API (e.g. Stripe, AWS) that returns the new credential
3. The **Rotator** saves the new value in MongoDB
4. The **Rotator** delivers the new value to every **target** defined on the secret:
   - `webhook` — POST the new value to a URL (e.g. `http://backend:8080/config/reload`)
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
2. **Auto-rotation**: Wait ~15s — the scheduler picks up the overdue secrets, rotates them, and delivers to the test webhook
3. **Manual rotation**: Click "Rotate" on any secret — rotation happens instantly
4. **Create a secret**: Click "+ Add Secret", pick a provider, add a webhook target
5. **Check deliveries**: The "Webhook Deliveries (Live)" panel shows every POST received
6. **Reset**: Click **"Clear All"** to wipe everything and start fresh

## API Endpoints

### Auth

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| POST   | /api/v1/auth/register     | Create a new account (returns JWT)   |
| POST   | /api/v1/auth/login        | Login (returns JWT)                  |
| GET    | /api/v1/auth/me           | Get current user profile             |

### Users (admin)

| Method | Endpoint                  | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | /api/v1/users             | List all users                       |
| GET    | /api/v1/users/:id         | Get user by ID                       |
| PUT    | /api/v1/users/:id         | Update user (name, role, isActive)   |
| DELETE | /api/v1/users/:id         | Delete a user                        |

### Secrets

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| GET    | /api/v1/secrets            | List all secrets (values masked)    |
| POST   | /api/v1/secrets            | Create a new secret                 |
| GET    | /api/v1/secrets/:id        | Get a single secret                 |
| PUT    | /api/v1/secrets/:id        | Update secret metadata              |
| DELETE | /api/v1/secrets/:id        | Delete a secret                     |
| POST   | /api/v1/secrets/:id/rotate | Queue a manual rotation job         |
| GET    | /api/v1/secrets/:id/logs   | Get rotation logs for a secret      |
| GET    | /api/v1/logs               | Get all rotation logs               |

### API Keys

| Method | Endpoint                       | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | /api/v1/api-keys               | List all API keys                |
| POST   | /api/v1/api-keys               | Generate a new API key           |
| PATCH  | /api/v1/api-keys/:id/revoke    | Revoke an API key                |
| DELETE | /api/v1/api-keys/:id           | Delete an API key                |

### Client Access (requires `x-api-key` header)

| Method | Endpoint                          | Description                         |
| ------ | --------------------------------- | ----------------------------------- |
| GET    | /api/v1/client/secrets/:name      | Fetch a secret by name (unmasked)   |

```bash
# Generate an API key
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "backend-service", "service": "payments"}'
# → { "key": "srm_a1b2c3...", ... }

# Fetch a secret using the key
curl http://localhost:3000/api/v1/client/secrets/STRIPE_API_KEY \
  -H "x-api-key: srm_a1b2c3..."
# → { "name": "STRIPE_API_KEY", "value": "sk_live_xxx", ... }
```

### Creating a Secret with Provider & Targets

```json
POST /api/v1/secrets
{
  "name": "STRIPE_API_KEY",
  "service": "payments",
  "value": "sk_live_xxx",
  "rotationIntervalDays": 7,
  "provider": "custom-api",
  "providerConfig": {
    "url": "https://api.stripe.com/v1/api_keys/roll",
    "method": "POST",
    "valuePath": "secret"
  },
  "targets": [
    {
      "type": "webhook",
      "label": "Backend API",
      "config": { "url": "http://backend:8080/config/reload" }
    }
  ]
}
```

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Backend**: Express 5, Node.js
- **Database**: MongoDB + Mongoose
- **Queue**: Redis + ioredis
- **Auth**: JWT + bcrypt
- **Frontend**: React 19 + Vite

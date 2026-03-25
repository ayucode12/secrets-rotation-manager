# Backend and Frontend Folder Structure

This document explains the new professional folder organization for the Secrets Rotation Manager project.

## Directory Layout

```
secrets-rotation-manager/
├── frontend/                    # Frontend application
│   └── public/
│       ├── index.html          # Main HTML entry point
│       ├── app.js              # Frontend logic and API integration
│       └── styles.css          # Professional dark theme styling
│
├── backend/                     # Backend application
│   ├── src/                    # Source code
│   │   ├── index.js            # Application entry point & bootstrap
│   │   ├── app.js              # Express setup & middleware
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── rotationRoutes.js    # Rotation API endpoints
│   │   │       └── healthRoutes.js      # Health check endpoints
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── errorHandler.js # Global error handling
│   │   │   └── requestLogger.js # HTTP request logging
│   │   └── utils/
│   │       └── logger.js       # Structured logging utility
│   ├── models/                 # MongoDB schemas
│   │   ├── SecretVault.js      # Secret storage schema
│   │   ├── RotationLog.js      # Rotation history schema
│   │   └── RotationSchedule.js # Cron schedule schema
│   ├── services/               # Business logic services
│   │   ├── rotationService.js  # Zero-downtime rotation orchestration
│   │   └── cronScheduler.js    # Cron task management
│   └── scripts/               # Utility scripts
│       ├── setup.js           # Initial setup
│       ├── migrate.js         # Database migrations
│       └── (platform-specific update scripts)
│
├── package.json               # Node dependencies
├── .env                       # Environment variables
├── .env.example               # Environment template
├── .eslintrc.json             # Linting rules
├── .prettierrc                # Code formatting
├── .editorconfig              # Editor configuration
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Container image
├── README.md                  # Project documentation
└── docs/                      # Additional documentation
    ├── PROJECT_STRUCTURE.md   # Architecture details
    ├── MIGRATION_GUIDE.md     # Restructuring guide
    └── ONBOARDING.md          # Developer setup
```

## Key Improvements

### Separation of Concerns
- **frontend/** - Client-side code (HTML, CSS, JavaScript)
- **backend/** - Server-side code organized by layer
  - `/src` - Application core (express app, routing, middleware)
  - `/models` - Database schemas
  - `/services` - Business logic
  - `/scripts` - Utility functions

### Scalability
- Easier to build separate Docker images for frontend and backend
- Can deploy independently to different services (App Service, Container Apps, etc.)
- Clear boundaries for microservices migration

### Maintainability
- Logical grouping of related code
- Clear module dependencies
- Industry-standard structure

## Running the Application

### Development
```bash
# Install dependencies
npm install

# Start backend server (from root)
npm run dev
```

Backend runs on `http://localhost:5000`
- API: `http://localhost:5000/api/rotations`
- Dashboard: `http://localhost:5000/app`

### Production
```bash
npm start
```

## Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up --build
```

Or build Docker image for production:
```bash
docker build -t secrets-rotation-manager .
docker run -p 5000:5000 --env-file .env secrets-rotation-manager
```

## Import Paths

When adding new files, use these relative import patterns:

From `backend/src/api/routes/`:
```javascript
const rotationService = require("../../../services/rotationService");
const SecretVault = require("../../../models/SecretVault");
```

From `backend/src/`:
```javascript
const cronScheduler = require("../services/cronScheduler");
const database = require("./config/database");
```

From `backend/services/`:
```javascript
const RotationLog = require("../models/RotationLog");
```

## API Documentation

The application provides these main endpoints:

### Health Checks
- `GET /health` - Full system status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Rotation Management
- `POST /api/rotations/manual` - Trigger manual rotation
- `GET /api/rotations/status/:id` - Get rotation status
- `GET /api/rotations/history/:secret` - Rotation history
- `GET /api/rotations/logs` - All rotation logs

### Secrets
- `POST /api/rotations/secrets/register` - Register new secret
- `GET /api/rotations/secrets` - List secrets
- `GET /api/rotations/secrets/:name` - Get secret metadata

### Schedules
- `POST /api/rotations/schedules/create` - Create rotation schedule
- `GET /api/rotations/schedules` - List active schedules
- `PATCH /api/rotations/schedules/:id` - Update schedule
- `DELETE /api/rotations/schedules/:id` - Disable schedule

## Environment Variables

See `.env.example` for complete list of configurations:
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed origins
- `LOG_LEVEL` - Logging verbosity
- `ENCRYPTION_KEY` - Secret encryption key

## Contributing

When adding new features:
1. Create files in appropriate directories
2. Follow the import path conventions above
3. Update this documentation if structure changes
4. Run `npm run lint` and `npm run format` before committing

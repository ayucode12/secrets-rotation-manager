# Quick Start Guide - Secrets Rotation Manager

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
cp .env.example .env

# Edit .env and set:
# MONGO_URI=mongodb://localhost:27017/secrets-rotation-manager
# ENCRYPTION_KEY=your_secure_key_here_minimum_32_chars
```

### Step 3: Start MongoDB (using Docker)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Initialize Database
```bash
node scripts/setup.js
```

### Step 5: Start Server
```bash
npm start
# OR for development with auto-reload:
npm run dev
```

### Step 6: Test API
```bash
# Health check
curl http://localhost:5000/health

# List all secrets
curl http://localhost:5000/api/rotations/secrets

# List all schedules
curl http://localhost:5000/api/rotations/schedules
```

## Common Use Cases

### Scenario 1: Rotate Database Password Immediately
```bash
curl -X POST http://localhost:5000/api/rotations/manual \
  -H "Content-Type: application/json" \
  -d '{
    "secretName": "production-db-password"
  }'
```

### Scenario 2: View Rotation History
```bash
curl http://localhost:5000/api/rotations/history/production-db-password
```

### Scenario 3: Setup Weekly Rotation Schedule
```bash
curl -X POST http://localhost:5000/api/rotations/schedules/create \
  -H "Content-Type: application/json" \
  -d '{
    "secretName": "api-key",
    "cronExpression": "0 3 * * 0",
    "affectedServices": ["api-service"],
    "description": "Weekly API key rotation"
  }'
```

### Scenario 4: Register New Secret
```bash
curl -X POST http://localhost:5000/api/rotations/secrets/register \
  -H "Content-Type: application/json" \
  -d '{
    "secretName": "my-new-secret",
    "secretType": "custom",
    "rotationPolicy": "my-policy-v1",
    "dependentServices": ["service1", "service2"]
  }'
```

## Docker Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongo --version

# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 mongo:latest
```

### Port Already in Use
```bash
# Change port in .env
PORT=5001

# Or find what's using port 5000
lsof -i :5000
kill -9 <PID>
```

### Can't Run Scripts
```bash
# Make scripts executable (Unix/Linux/Mac)
chmod +x scripts/*.sh

# Run with bash explicitly
bash scripts/setup.js
```

## Next Steps

1. **Read Documentation**: See README.md for complete API documentation
2. **Configure Services**: Update scripts in `scripts/` for your services
3. **Setup Policies**: Create rotation policies in `rotation-policies/`
4. **Configure Schedules**: Create automated rotation schedules
5. **Test Rotations**: Test with non-critical secrets first
6. **Deploy**: Use Docker Compose or Kubernetes for production

## Directory Structure

```
secrets-rotation-manager/
├── config/              # Configuration files
├── models/              # MongoDB schemas
├── routes/              # Express routes
├── services/            # Core business logic
├── scripts/             # Service update scripts + setup
├── middleware/          # Express middleware
├── utils/               # Helper utilities
├── rotation-policies/   # Git-tracked policies
├── server.js            # Entry point
├── package.json         # Dependencies
└── .env.example         # Environment template
```

## Key Files

- `server.js` - Main application entry point
- `routes/rotationRoutes.js` - All API endpoints
- `services/rotationService.js` - Core rotation logic
- `services/cronScheduler.js` - Automated scheduling
- `models/*.js` - MongoDB data models
- `scripts/setup.js` - Database initialization

## Important Commands

```bash
# Development
npm run dev

# Production
npm start

# Setup database
node scripts/setup.js

# Test API
bash API_TESTING.sh

# Docker
docker-compose up

# Linting
npm run lint

# Tests
npm test
```

## Support

- **Logs**: Check console output or `logs/` directory
- **Database**: Query MongoDB with `mongosh`
- **API Docs**: See README.md for endpoint details
- **Policies**: See ROTATION_POLICIES.md for policy guidelines

---
**Happy rotating! 🔐**

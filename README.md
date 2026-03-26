# Secrets Rotation Manager

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Enterprise-grade secrets rotation system with zero-downtime deployment, professional dashboard, and advanced automation.

## Overview

The Secrets Rotation Manager is a comprehensive solution designed for enterprise environments to automate the lifecycle management of secrets, credentials, and API keys. Built on a modern, production-ready Node.js stack with a professional React SPA frontend.

### Key Features

- **Zero-Downtime Rotation**: Seamless secret updates without service interruption
- **Professional Dashboard**: Real-time monitoring and management UI
- **Automated Scheduling**: Cron-based rotation policies
- **Audit Logging**: Complete rotation history and compliance tracking
- **RESTful API**: Complete API for integration
- **Multi-Service Support**: Coordinate rotations across dependent services
- **Dashboard UI**: Modern, responsive web interface
- **Docker Ready**: Containerized deployment ready
- **CI/CD Integration**: GitHub Actions workflows included
- **Security Hardened**: Helmet, rate limiting, input sanitization

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ (ES6+)
- **Framework**: Express.js 5.x
- **Database**: MongoDB 5.0+
- **Process Scheduling**: node-cron
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize
- **Utilities**: UUID, dotenv

### Frontend
- **HTML5** with semantic structure
- **Vanilla JavaScript** (ES6+) for lightweight performance
- **Modern CSS3** with professional dark theme
- **Responsive Design** for desktop and tablet

### Development
- **Testing**: Jest with coverage reporting
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions workflows
- **Version Control**: Git

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/ayucode12/secrets-rotation-manager.git
cd secrets-rotation-manager

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start MongoDB (using Docker)
docker-compose up -d

# Run development server
npm run dev

# Access the application
# Frontend UI: http://localhost:5000/app
# API: http://localhost:5000/api
# Health: http://localhost:5000/health
```

### Using Docker

```bash
# Start entire stack with Docker Compose
docker-compose up

# Stop services
docker-compose down
```

## Project Structure

```
src/
├── index.js              # Application entry point
├── app.js                # Express setup
├── api/                  # API routes and handlers
├── config/               # Configuration
├── middleware/           # Express middleware
├── models/               # Database models
├── services/             # Business logic
└── utils/                # Utilities

public/                    # Frontend SPA assets
tests/                     # Test suites
docs/                      # Documentation
.github/workflows/         # CI/CD workflows
```

For detailed structure, see [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

## API Documentation

### Core Endpoints

#### Secrets Management
- `POST /api/rotations/secrets/register` - Register new secret
- `GET /api/rotations/secrets` - List all secrets
- `GET /api/rotations/secrets/:secretName` - Get secret metadata
- `PATCH /api/rotations/secrets/:secretName` - Update secret

#### Rotation Management
- `POST /api/rotations/manual` - Trigger manual rotation
- `GET /api/rotations/status/:rotationId` - Check rotation status
- `POST /api/rotations/cancel/:rotationId` - Cancel rotation
- `GET /api/rotations/history/:secretName` - Rotation history
- `GET /api/rotations/logs` - Rotation logs

#### Schedule Management
- `POST /api/rotations/schedules/create` - Create rotation schedule
- `GET /api/rotations/schedules` - List active schedules
- `GET /api/rotations/schedules/:secretName` - Get schedule details
- `PATCH /api/rotations/schedules/:scheduleId` - Update schedule
- `DELETE /api/rotations/schedules/:scheduleId` - Deactivate schedule

#### System Health
- `GET /health` - System health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## Development

### Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start with hot reload
npm test              # Run test suite with coverage
npm run test:watch    # Tests in watch mode
npm run lint          # Run ESLint with auto-fix
npm run format        # Format code with Prettier
npm run setup         # Initial setup
npm run seed          # Seed database with sample data
npm run migrate       # Database migrations
```

### Code Quality

- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier for consistent style
- **Testing**: Jest with coverage thresholds

```bash
# Run all quality checks
npm run lint
npm run format -- --check
npm test
```

## Features

### Dashboard UI (`/app`)
- Real-time statistics and status
- Secret management interface
- Manual rotation triggering
- Schedule creation and management
- Log viewing and filtering
- Health monitoring
- Quick setup for demo data

### API Features
- RESTful design with standard HTTP methods
- JSON request/response format
- Comprehensive error handling
- Request logging and tracking
- Rate limiting protection
- CORS support
- Input sanitization

### Security
- Environment-based configuration
- Helmet.js for HTTP security headers
- CSRF protection ready
- Rate limiting (100 req/15 min by default)
- Input validation and sanitization
- Secure password hashing with bcrypt
- JWT token support
- HTTPS ready for production

### Operations
- Graceful shutdown handling
- Health check endpoints
- Memory monitoring
- Process uptime tracking
- Structured logging
- Error recovery mechanisms

## Configuration

Environment variables are managed via `.env` file. Copy `.env.example` and customize:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/secrets-rotation-manager

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=http://localhost:5000
API_KEY_VALIDATION=true
```

See `.env.example` for complete configuration options.

## Deployment

### Docker

```bash
# Build Docker image
docker build -t secrets-rotation-manager .

# Run container
docker run -p 5000:5000 --env-file .env secrets-rotation-manager
```

### Docker Compose

```bash
# Development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Tear down
docker-compose down
```

### Production Considerations
- Use managed MongoDB (Atlas, Azure, AWS)
- Configure HTTPS/TLS
- Set strong JWT and session secrets
- Use production environment variables
- Enable rate limiting
- Configure proper CORS
- Set up monitoring and alerting
- Use process manager (PM2, systemd)
- Implement backup strategy

## Testing

```bash
# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Run specific test file
npm test -- rotationRoutes

# View coverage report
npm test -- --coverage
```

## CI/CD

### GitHub Actions Workflows

- **CI Pipeline** (`.github/workflows/ci.yml`)
  - Lint and format checks
  - Test suite execution
  - Coverage reporting

- **Deployment** (`.github/workflows/deploy.yml`)
  - Docker image build and push
  - Production deployment

## Monitoring

### Health Endpoints

```bash
# General health check
curl http://localhost:5000/health

# Readiness probe
curl http://localhost:5000/health/ready

# Liveness probe
curl http://localhost:5000/health/live
```

### Logging

Logs are written to both console and files in `./logs/`:
- `error-[date].log` - Error level logs
- `warn-[date].log` - Warning level logs
- `info-[date].log` - Info level logs
- `debug-[date].log` - Debug level logs

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test: `npm test`
4. Lint and format: `npm run lint && npm run format`
5. Commit with clear messages: `git commit -m "feat: description"`
6. Push to your fork: `git push origin feature/your-feature`
7. Create a Pull Request

## Roadmap

- [ ] User authentication and authorization
- [ ] Advanced RBAC (Role-Based Access Control)
- [ ] Webhook notifications
- [ ] Multi-region support
- [ ] Backup and disaster recovery
- [ ] Advanced audit logging
- [ ] Metrics and prometheus integration
- [ ] Terraform module for infrastructure

## Troubleshooting

### MongoDB Connection Issues
```bash
# Verify MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb
```

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/ayucode12/secrets-rotation-manager/issues)
- Documentation: [See docs/](./docs/)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
This is very important.

---

**Version**: 2.0.0 | **Last Updated**: March 2026 | **Status**: Production Ready

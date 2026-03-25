# Project Structure

## Overview

This is a professional enterprise-grade Node.js project following industry best practices and clean architecture principles.

```
secrets-rotation-manager/
├── src/                          # Source code
│   ├── index.js                  # Application entry point
│   ├── app.js                    # Express application setup
│   ├── api/                      # API layer
│   │   └── routes/               # API route handlers
│   │       ├── healthRoutes.js   # Health check endpoints
│   │       └── rotationRoutes.js # Rotation management endpoints
│   ├── config/                   # Configuration files
│   │   └── database.js           # MongoDB connection setup
│   ├── middleware/               # Express middleware
│   │   ├── errorHandler.js       # Global error handler
│   │   └── requestLogger.js      # Request logging middleware
│   ├── models/                   # Mongoose data models
│   ├── services/                 # Business logic layer
│   ├── utils/                    # Utility functions
│   │   └── logger.js             # Logging utility
│   └── validators/               # Input validation schemas
├── public/                       # Frontend assets
│   ├── index.html               # SPA entry point
│   ├── app.js                   # Client-side JavaScript
│   └── styles.css               # Dashboard styling
├── tests/                        # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test data
├── scripts/                      # Utility scripts
│   ├── setup.js                 # Initial setup script
│   ├── seed.js                  # Database seeding
│   └── migrate.js               # Database migration
├── docs/                         # Documentation
│   ├── API.md                   # API documentation
│   ├── DEPLOYMENT.md            # Deployment guide
│   └── CONTRIBUTING.md          # Contribution guidelines
├── .github/                      # GitHub configuration
│   ├── workflows/               # CI/CD workflows
│   │   ├── ci.yml              # Continuous integration
│   │   └── deploy.yml          # Deployment pipeline
│   └── ISSUE_TEMPLATE/          # Issue templates
├── .env.example                 # Environment variables template
├── .env                         # Environment configuration (git ignored)
├── .editorconfig                # Editor configuration
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Git ignore rules
├── .dockerignore                # Docker ignore rules
├── Dockerfile                   # Docker container definition
├── docker-compose.yml           # Docker Compose for local dev
├── package.json                 # Node.js dependencies and scripts
├── package-lock.json            # Locked dependency versions
├── jest.config.js               # Jest test configuration
├── README.md                    # Project README
└── CHANGELOG.md                 # Change log
```

## Directory Purpose

### `/src` - Source Code
Main application code following clean architecture principles.

- **api/**: API endpoints and route handlers
- **config/**: Configuration for services (database, cache, etc.)
- **middleware/**: Express middleware for request processing
- **models/**: Mongoose schemas and data models
- **services/**: Business logic and service layer
- **utils/**: Utility functions and helpers
- **validators/**: Input validation and schema definitions

### `/public` - Frontend
Client-side SPA assets served to `/app` endpoint.

### `/tests` - Test Suite
Comprehensive test coverage for unit, integration, and e2e tests.

### `/scripts` - Utility Scripts
Development and operational scripts.

### `/docs` - Documentation
Project documentation including API specs and deployment guides.

### `/.github` - GitHub Configuration
CI/CD workflows and GitHub-specific configuration.

### Root Configuration Files

- **.env**: Environment variables (git ignored, use .env.example as template)
- **.editorconfig**: Editor formatting rules
- **.eslintrc.json**: ESLint linting configuration
- **.prettierrc**: Prettier code formatting rules
- **.gitignore**: Git ignore patterns
- **.dockerignore**: Docker build ignore patterns
- **docker-compose.yml**: Local development environment
- **package.json**: Dependencies and npm scripts
- **jest.config.js**: Test runner configuration

## Architecture

### Clean Architecture Layers

1. **Presentation Layer** (public/, public/app.js)
   - User interface and frontend
   - Direct browser interaction

2. **API Layer** (src/api/routes/)
   - HTTP endpoints
   - Request/response handling
   - Route definitions

3. **Service Layer** (src/services/)
   - Business logic
   - Core functionality
   - External service integration

4. **Data Layer** (src/models/, src/config/database.js)
   - Data access
   - Persistence logic
   - Database operations

5. **Cross-Cutting Concerns**
   - Middleware (src/middleware/)
   - Utilities (src/utils/)
   - Logging and error handling

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

### Setup

```bash
# 1. Clone repository
git clone https://github.com/ayucode12/secrets-rotation-manager.git
cd secrets-rotation-manager

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your configuration
nano .env

# 4. Install dependencies
npm install

# 5. Start MongoDB (local or Docker)
docker-compose up -d

# 6. Run development server
npm run dev

# 7. Access application
# Frontend: http://localhost:5000/app
# API: http://localhost:5000/api
# Health: http://localhost:5000/health
```

### Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start with hot reload (nodemon)
npm test              # Run test suite with coverage
npm run test:watch    # Run tests in watch mode
npm run lint          # Run ESLint with auto-fix
npm run format        # Format code with Prettier
npm run setup         # Initial project setup
npm run seed          # Seed database with sample data
npm run migrate       # Run database migrations
```

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and test**
   ```bash
   npm run dev    # Local development
   npm test       # Run tests
   npm run lint   # Check code quality
   ```

3. **Commit and push**
   ```bash
   git commit -m "feat: description"
   git push origin feature/new-feature
   ```

4. **Create pull request** on GitHub

5. **Automated checks**
   - CI pipeline runs (lint, format, tests)
   - Code review by team members
   - Merge to main/develop

## Project Conventions

### Code Style
- JavaScript ES6+ features
- Semicolons required
- Double quotes for strings
- 2-space indentation
- Max line length: 100 characters

### Naming Conventions
- **Files**: kebab-case (e.g., `error-handler.js`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions**: camelCase (e.g., `getUserById()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)

### API Conventions
- RESTful endpoints
- HTTP method semantics (GET, POST, PATCH, DELETE)
- JSON request/response format
- Standard HTTP status codes
- Descriptive error messages

### Logging
- Use `logger` utility from `src/utils/logger.js`
- Levels: error, warn, info, debug
- Structured logging with context data

## Security Practices

- Helmet.js for HTTP headers security
- CORS configuration
- Rate limiting on API endpoints
- Input sanitization via mongo-sanitize
- Environment variable protection
- Secure password hashing (bcrypt)
- JWT token authentication
- HTTPS in production

## Performance

- Request logging middleware
- Error handling and recovery
- Database connection pooling
- Graceful shutdown handling
- Memory monitoring

## Monitoring & Logging

- Centralized logging utility
- File-based log persistence
- Structured log format with timestamps
- Different log levels for development/production
- HTTP request duration tracking

## Database

- MongoDB connection management
- Connection pooling
- Automatic reconnection on failure
- Event-based connection status monitoring

## Testing

- Unit tests for services and utilities
- Integration tests for API routes
- Test database isolated from production
- Jest test framework with coverage reporting
- Mock data and fixtures for testing

## Deployment

### Docker

```bash
# Build image
docker build -t secrets-rotation-manager .

# Run container
docker run -p 5000:5000 --env-file .env secrets-rotation-manager
```

### Docker Compose

```bash
# Local development environment
docker-compose up -d

# Stop
docker-compose down
```

### Production

- Docker image deployment
- Kubernetes orchestration ready
- Health check endpoints
- Graceful shutdown
- Environment-based configuration

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](./LICENSE) for details

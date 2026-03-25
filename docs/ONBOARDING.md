# Developer Onboarding Checklist

Welcome to the Secrets Rotation Manager project! This checklist will help you get started quickly.

## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed and configured (`git --version`)
- [ ] Docker & Docker Compose for local development
- [ ] A code editor (VS Code recommended)
- [ ] GitHub account with repository access

## Setup (First Time Only)

### 1. Clone Repository
```bash
git clone https://github.com/ayucode12/secrets-rotation-manager.git
cd secrets-rotation-manager
```
- [ ] Repository cloned
- [ ] Correct branch (should be `main`)

### 2. Install Dependencies
```bash
npm install
```
- [ ] No errors during npm install
- [ ] ~450+ packages installed
- [ ] `node_modules/` directory created

### 3. Environment Configuration
```bash
cp .env.example .env
```
- [ ] `.env` file created
- [ ] Edit `.env` with your settings (optional for local dev)

### 4. Start MongoDB
```bash
docker-compose up -d
```
- [ ] MongoDB container started and running
- [ ] Verify with: `docker-compose ps`

### 5. Start Development Server
```bash
npm run dev
```
- [ ] Server starts on port 5000
- [ ] No startup errors in console
- [ ] MongoDB connects successfully

### 6. Verify Installation
```bash
# In another terminal
curl http://localhost:5000/               # Should return JSON
curl http://localhost:5000/health         # Should show status: "ok"
curl http://localhost:5000/app            # Should load HTML
```
- [ ] All three endpoints responding
- [ ] Dashboard loads in browser

## Development Environment Setup

### Code Editor (VS Code)

#### Extensions to Install
- [ ] ESLint (`dbaeumer.vscode-eslint`)
- [ ] Prettier (`esbenp.prettier-vscode`)
- [ ] Thunder Client (`rangav.vscode-thunder-client`) - for API testing
- [ ] MongoDB for VS Code (`mongodb.mongodb-vscode`)
- [ ] Git Graph (`mhutchie.git-graph`)

#### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "javascriptreact"],
  "eslint.run": "onSave"
}
```
- [ ] Settings file created
- [ ] Format on save enabled
- [ ] ESLint integration working

### Git Configuration

```bash
# Set git user (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```
- [ ] Git user name configured
- [ ] Git user email configured

## Understanding the Project

### Key Files to Review

- [ ] Read `README.md` - Project overview
- [ ] Read `docs/PROJECT_STRUCTURE.md` - Architecture guide
- [ ] Review `.env.example` - Available configuration
- [ ] Check `package.json` - Scripts and dependencies

### Project Structure

- [ ] Understand `src/` organization
- [ ] Note API routes in `src/api/routes/`
- [ ] Review middleware in `src/middleware/`
- [ ] Familiar with models in `models/`
- [ ] Understand services in `services/`

### API Exploration

```bash
# Test API endpoints
# Get all secrets
curl -X GET http://localhost:5000/api/rotations/secrets

# View health
curl -X GET http://localhost:5000/health

# Check logs
curl -X GET http://localhost:5000/api/rotations/logs
```
- [ ] Can call API endpoints
- [ ] Understand request/response format
- [ ] Familiar with API structure

### Frontend

- [ ] Open Dashboard: http://localhost:5000/app
- [ ] Click through different tabs
- [ ] Try "Quick Setup" to create sample data
- [ ] Explore all dashboard features

## Development Workflow

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Watch tests during development
npm run test:watch
```

- [ ] ESLint runs without errors
- [ ] Code formats properly
- [ ] Tests pass
- [ ] Familiar with code quality tools

### Common Tasks

#### Creating a New API Endpoint
1. [ ] Create route handler in `src/api/routes/`
2. [ ] Import route in `src/app.js`
3. [ ] Write tests in `tests/`
4. [ ] Run lint and tests
5. [ ] Create pull request

#### Modifying Business Logic
1. [ ] Update service in `src/services/`
2. [ ] Run tests
3. [ ] Update related routes if needed
4. [ ] Test manually via API
5. [ ] Commit with clear message

#### Database Schema Changes
1. [ ] Update model in `models/`
2. [ ] Create migration script in `scripts/`
3. [ ] Test data migration
4. [ ] Document changes in CHANGELOG.md

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add src/
git commit -m "feat: description of feature"

# Keep branch updated
git fetch origin
git rebase origin/main

# Push to fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

- [ ] Comfortable with branch creation
- [ ] Understand commit message format
- [ ] Know how to push changes
- [ ] Ready to create pull requests

## Testing

### Run Tests

```bash
# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Run specific test
npm test -- rotationRoutes
```

- [ ] Test command works locally
- [ ] Can run specific tests
- [ ] Coverage report generated
- [ ] Can read test failures

### Writing Tests

- [ ] Understand jest configuration
- [ ] Know test file location: `tests/`
- [ ] Familiar with `describe` and `test` syntax
- [ ] Understand mocking and fixtures

## Debugging

### Using Debugger

```javascript
// Add debugger statement
debugger;  // Execution pauses here when dev tools open

// Or use console logging
console.log("Value:", value);
```

- [ ] Know where to add debugging
- [ ] Comfortable with console logging
- [ ] Understand VS Code debugging panel

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change PORT in .env or kill process |
| MongoDB won't start | Run `docker-compose logs mongodb` |
| npm modules issue | Delete `node_modules/` and run `npm install` |
| ESLint errors | Run `npm run lint` then fix manually |

- [ ] Know how to troubleshoot common issues
- [ ] Can read error messages
- [ ] Know where to find help

## Useful Commands

```bash
# Development
npm run dev              # Start with hot reload
npm start                # Start production mode

# Code Quality
npm run lint             # Check linting
npm run format           # Auto-format code
npm test                 # Run tests

# Database/Utilities
npm run seed             # Seed sample data
npm run migrate          # Run migrations
npm run setup            # Initial setup

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose ps        # View running containers
```

- [ ] Created cheat sheet of useful commands
- [ ] Bookmarked this in your editor

## Documentation

### Internal Docs

- [ ] Read `README.md` for overview
- [ ] Study `docs/PROJECT_STRUCTURE.md` for architecture
- [ ] Review `docs/MIGRATION_GUIDE.md` for recent changes
- [ ] Check `.env.example` for configuration options

### External Resources

- [ ] Express.js docs: https://expressjs.com
- [ ] MongoDB docs: https://docs.mongodb.com
- [ ] Jest testing: https://jestjs.io
- [ ] Node.js best practices

## Communication & Support

- [ ] Know how to report issues on GitHub
- [ ] Understand how to ask questions
- [ ] Join team communication channels
- [ ] Review CONTRIBUTING.md for guidelines

## Final Checklist

- [ ] Project cloned and dependencies installed
- [ ] Development server runs without errors
- [ ] Can access frontend dashboard (`/app`)
- [ ] API endpoints respond correctly
- [ ] IDE configured with extensions
- [ ] ESLint and Prettier working
- [ ] Tests run successfully
- [ ] Git configured and workflow understood
- [ ] Project structure understood
- [ ] Development workflow clear
- [ ] Useful commands documented
- [ ] Can identify where to make changes
- [ ] Comfortable asking questions
- [ ] Ready to tackle first issue

## First Task Ideas

Once you're set up, try these tasks to get familiar:

### Beginner
1. [ ] Add a new environment variable and use it
2. [ ] Create a simple utility function
3. [ ] Add console logging to understand flow
4. [ ] Fix a simple linting error

### Intermediate
1. [ ] Add a new validation rule
2. [ ] Create a new endpoint
3. [ ] Write unit tests for a function
4. [ ] Improve error handling for a route

### Advanced
1. [ ] Implement new feature
2. [ ] Refactor existing code
3. [ ] Optimize database queries
4. [ ] Add comprehensive tests

## Post-Setup

### Stay Updated

```bash
# Fetch latest changes
git fetch origin

# See what changed
git log origin/main..main

# Pull latest
git pull origin main
```

### Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update for security
npm audit fix
```

## Next Steps

1. [ ] Ask project lead for first issue
2. [ ] Branch off from latest main
3. [ ] Make first changes
4. [ ] Submit pull request
5. [ ] Gather feedback and iterate

---

**Welcome to the team! 🎉**

If you get stuck, check the documentation or ask in comments on GitHub issues.

**Need help?** See `CONTRIBUTING.md` for guidelines.

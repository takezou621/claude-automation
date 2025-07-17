# Technology Stack & Build System

## Core Technologies

- **Runtime**: Node.js 18+ (required)
- **Language**: JavaScript (ES6+), Python 3.11+
- **Package Manager**: npm 9.0.0+
- **Testing**: Jest with coverage reporting
- **Linting**: ESLint with Standard config
- **Documentation**: JSDoc for API documentation

## Key Dependencies

### Production
- **AI Integration**: Claude API client (Anthropic)
- **GitHub Integration**: @octokit/rest, GitHub Actions
- **CLI Tools**: commander, inquirer, ora, chalk
- **Utilities**: lodash, moment, fs-extra, glob, minimatch
- **Logging**: winston
- **Web Server**: express (for webhook server)

### Development
- **Testing**: jest, supertest, nock
- **Code Quality**: eslint, prettier, husky, lint-staged
- **Documentation**: jsdoc

## Common Commands

### Development
```bash
# Start main automation system
npm start

# Start simple automation system  
npm run start:simple

# Development with auto-reload
npm run dev
npm run dev:simple

# CLI interface
npm run cli
```

### Testing & Quality
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Build (lint + test)
npm run build
```

### Automation Tools
```bash
# Initialize automation
npm run automation:init

# Health check
npm run automation:health

# Batch processing
npm run automation:batch

# View statistics
npm run automation:stats

# Interactive mode
npm run automation:interactive
```

### Specialized Commands
```bash
# Security scanning
npm run security:scan

# Code analysis
npm run analyze:code

# Claude API testing
npm run claude:test

# Configuration management
npm run config:init
npm run config:validate

# Webhook server
npm run webhook:start
npm run webhook:dev
```

### Docker Support
```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Docker Compose
npm run docker:compose
npm run docker:stop
```

## Configuration Standards

- **Environment Variables**: Use `.env` files, never commit secrets
- **Config Files**: JSON format in `config/` directory
- **ESLint Rules**: Standard config with semicolons required, single quotes
- **Test Coverage**: Minimum 80% coverage required
- **Node Version**: Engines field enforces Node 18+ and npm 9+

## GitHub Actions Integration

- **Execution Environment**: ubuntu-latest
- **Timeout**: 60 minutes for complex workflows, 5 minutes for rapid
- **Permissions**: contents:write, pull-requests:write, issues:write
- **Scheduling**: Cron-based with multiple tiers (every minute to daily)
# Project Structure & Organization

## Root Directory Layout

```
claude-automation/
├── .github/workflows/          # GitHub Actions automation workflows
├── .kiro/                      # Kiro IDE configuration and specs
├── src/                        # Main source code
├── tests/                      # Test files
├── docs/                       # Documentation
├── examples/                   # Usage examples
├── scripts/                    # Setup and utility scripts
├── lib/                        # Shared utilities
├── docker/                     # Docker configuration
├── coverage/                   # Test coverage reports
└── test-automation/            # Automation testing utilities
```

## Source Code Organization (`src/`)

### Core Components
- `simple-automation-system.js` - Main automation engine
- `claude-api-client.js` - Claude AI integration
- `github-client.js` - GitHub API wrapper
- `config-manager.js` - Configuration management
- `cli.js` - Command-line interface

### Specialized Modules
- `intelligent-code-analyzer.js` - AI-powered code analysis
- `security-analyzer.js` - Security pattern detection
- `webhook-server.js` - GitHub webhook handling
- `branch-pattern-manager.js` - Branch naming conventions
- `tier-execution-handler.js` - Multi-tier automation logic

### Utility Files
- `fix_*.py` - Python fix scripts (numbered sequentially)
- `performance-analytics-manager.js` - Performance tracking
- `intelligent-schedule-manager.js` - Smart scheduling

## GitHub Workflows (`.github/workflows/`)

### Automation Tiers
- `claude-ultimate-automation.yml` - Every minute execution
- `claude-rapid-automation.yml` - 5-minute intervals
- `claude-smart-automation.yml` - Intelligent scheduling
- `claude-code-review.yml` - PR-triggered reviews
- `claude-issue-processor.yml` - Issue management

## Testing Structure (`tests/`)

### Test Organization
- `*.test.js` - Jest test files matching source files
- Test files mirror `src/` structure
- Mock external dependencies (GitHub API, Claude API)
- Coverage reports generated in `coverage/`

## Documentation (`docs/`)

### Structure
- `README.md` - Main documentation index
- `setup.md` / `setup.ja.md` - Installation guides
- `usage.md` / `usage.ja.md` - Usage instructions
- `troubleshooting.md` - Common issues and solutions
- `workflow-selection-guide.md` - Automation tier selection
- `*.html` - Generated JSDoc API documentation
- Japanese specifications in `仕様書_*.md` and `要件定義書_*.md`

## Configuration Files

### Root Level
- `package.json` - Dependencies, scripts, and project metadata
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore patterns
- `LICENSE` - MIT license
- `CONTRIBUTING.md` - Contribution guidelines

### Specialized Config
- `docker/` - Docker configuration files
- `.kiro/` - Kiro IDE settings and specifications
- `.claude/` - Claude-specific settings

## Naming Conventions

### Files
- **JavaScript**: kebab-case (e.g., `claude-api-client.js`)
- **Python**: snake_case with prefixes (e.g., `fix_19.py`)
- **Tests**: `*.test.js` suffix
- **Documentation**: descriptive names with language suffixes (`.ja.md`)

### Classes
- PascalCase (e.g., `ClaudeAPIClient`, `SimpleAutomationSystem`)

### Functions/Variables
- camelCase for JavaScript
- snake_case for Python
- Descriptive names reflecting functionality

### Constants
- UPPER_SNAKE_CASE (e.g., `CLAUDE_API_BASE_URL`, `MAX_TOKENS`)

## Branch Patterns

The system supports multiple branch naming conventions:
- `issue-{number}` - Standard pattern
- `claude-{number}` - Claude-specific
- `feature/issue-{number}` - Feature branches
- `fix/issue-{number}` - Bug fixes
- `hotfix/issue-{number}` - Emergency fixes
- `security/issue-{number}` - Security fixes

## Label System

### Automation Triggers
- `claude-processed`, `claude-ready`, `automation-ready`
- `rapid-process`, `claude-full-automation`

### Priority Levels
- `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- `urgent`, `hotfix`

### Quality Gates
- `security-review`, `quality:gold`, `complexity:high`
- `needs-tests`, `manual-only`

## Development Workflow

1. **Source files** in `src/` with corresponding **tests** in `tests/`
2. **Documentation** updates in `docs/` for new features
3. **GitHub workflows** handle automation tiers
4. **Configuration** managed through `config-manager.js`
5. **Quality gates** enforced through ESLint, Jest, and security scanning
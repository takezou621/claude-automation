# Usage Guide

This guide explains how to use the **Claude Automation System** with all three automation tiers: Ultimate, Rapid, and Smart.

## 🚀 Automation Tiers Overview

| Tier | Schedule | Response Time | Best For |
|------|----------|---------------|----------|
| **🔥 Ultimate** | Every minute | < 1 minute | Critical projects |
| **⚡ Rapid** | Every 5 minutes | < 5 minutes | Fast development |
| **🧠 Smart** | Scheduled | Hours | Standard projects |

## Workflow Overview

The automation follows these steps:
1. An issue is created with supported labels (`claude-processed`, `claude-ready`, `automation-ready`)
2. A developer or AI creates a branch and implements the required changes
3. The automation script runs on schedule, detects the new branch, and creates a Pull Request
4. The PR is automatically merged
5. The issue is closed, and the branch is deleted

## Step-by-Step Instructions

### 1. Create an Issue

To trigger the automation, create a new issue with one of the supported labels:

**Supported Labels:**
- `claude-processed` - Standard Claude processing
- `claude-ready` - Ready for automation  
- `automation-ready` - General automation ready
- `rapid-process` - Rapid tier specific

**Example using `gh` CLI:**
```bash
# For Ultimate/Rapid processing
gh issue create --title "Refactor: Improve database query performance" \
  --body "@claude Please refactor the query in `user-service.js` to be more efficient." \
  --label "claude-processed,priority:high"

# For rapid processing specifically
gh issue create --title "Fix: Login validation bug" \
  --body "@claude Please fix the validation issue in login form." \
  --label "claude-ready,rapid-process"
```

### 2. Implement the Code

Create a branch for your work. The enhanced automation now supports **multiple branch naming patterns**:

**Supported Branch Patterns:**
- `issue-{number}` - Standard: `issue-123`
- `claude-{number}` - Claude: `claude-123`  
- `feature/issue-{number}` - Feature: `feature/issue-123`
- `fix/issue-{number}` - Fix: `fix/issue-123`
- `claude/issue-{number}` - Claude namespace: `claude/issue-123`
- `automation-{number}` - Automation: `automation-123`
- `rapid-{number}` - Rapid: `rapid-123`

Commit and push your changes to the repository.

```bash
# Examples for different patterns
git checkout -b feature/issue-123
# OR
git checkout -b claude-123
# OR  
git checkout -b claude/issue-123

# ...make your code changes...
git add .
git commit -m "feat: Implement new feature for #123"
git push origin feature/issue-123
```

### 3. Let the Automation Work

Once your branch is pushed, the automation will take over during its next scheduled run. It will:
- Find the branch associated with the issue.
- Create a Pull Request.
- Merge the Pull Request.
- Close the original issue.
- Delete the source branch.

You don't need to do anything else!

## Manual Trigger

You can manually trigger any of the automation tiers when needed:

### GitHub Web Interface
1. Go to the **Actions** tab in your GitHub repository
2. Select your desired workflow:
   - **Claude Ultimate Automation** (every minute)
   - **Claude Rapid Automation** (every 5 minutes)  
   - **Claude Smart Automation** (scheduled)
3. Click the **Run workflow** dropdown and then **Run workflow**

### Using GitHub CLI

```bash
# Ultimate Automation (fastest)
gh workflow run claude-ultimate-automation.yml

# Rapid Automation (balanced)
gh workflow run claude-rapid-automation.yml

# Smart Automation (scheduled)
gh workflow run claude-smart-automation.yml
```

### Check Execution Status

```bash
# List recent runs for specific workflow
gh run list --workflow="claude-ultimate-automation.yml" --limit 5

# View detailed logs
gh run view <run-id> --log
```


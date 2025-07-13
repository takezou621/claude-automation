# Usage Guide

This guide explains how to use the Claude Smart Automation System on a daily basis.

## Workflow Overview

The automation follows these steps:
1.  An issue is created with the `claude-processed` label.
2.  A developer or AI creates a branch and implements the required changes.
3.  The automation script runs on a schedule, detects the new branch, and creates a Pull Request.
4.  The PR is automatically merged.
5.  The issue is closed, and the branch is deleted.

## Step-by-Step Instructions

### 1. Create an Issue

To trigger the automation, create a new issue and add the `claude-processed` label. You can also mention the AI user (e.g., `@claude`) in the body to provide instructions.

**Example using `gh` CLI:**
```bash
gh issue create --title "Refactor: Improve database query performance" \
  --body "@claude Please refactor the query in `user-service.js` to be more efficient." \
  --label "claude-processed,refactor"
```

### 2. Implement the Code

Create a branch for your work. The branch name should include the issue number to be discoverable by the automation. For example:

- `feature/issue-123`
- `bugfix/123-fix-login-bug`

Commit and push your changes to the repository.

```bash
# Example
git checkout -b feature/issue-123
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

If you need to run the automation immediately, you can trigger it manually.

1.  Go to the **Actions** tab in your GitHub repository.
2.  Select the **Claude Smart Automation** workflow.
3.  Click the **Run workflow** dropdown and then **Run workflow**.

**Example using `gh` CLI:**
```bash
gh workflow run claude-smart-automation.yml
```

This will start the automation process without waiting for the next scheduled run.


# Smart Automation Setup Guide

This guide provides a detailed walkthrough for setting up the Claude Smart Automation System.

## 1. Repository Setup

### Option A: Use the Setup Script (Recommended)

Our setup script automates most of the process.

```bash
# Format: ./scripts/setup-smart-automation.sh <owner> <repo>
./scripts/setup-smart-automation.sh your-github-username your-repo-name
```

The script will:
- Create the necessary labels in your repository.
- Copy the workflow file to `.github/workflows/`.
- Provide instructions for the next steps.

### Option B: Manual Setup

1.  **Create Labels**:
    In your repository, go to `Settings` > `Labels` and create:
    - `claude-processed`
    - `claude-completed`
    - `claude-failed`

2.  **Copy Workflow File**:
    Copy the content of `templates/claude-smart-automation.yml` into a new file at `.github/workflows/claude-smart-automation.yml` in your repository.

## 2. Configure GitHub Actions Permissions

For the workflow to manage issues, PRs, and branches, it needs appropriate permissions.

1.  Go to your repository `Settings`.
2.  Navigate to `Actions` > `General`.
3.  In the `Workflow permissions` section, select **Read and write permissions**.
4.  Click **Save**.

## 3. Customize the Workflow (Optional)

You can tailor the automation to your needs by editing `.github/workflows/claude-smart-automation.yml`.

### Schedule

Change the `cron` schedule to control when the automation runs.

```yaml
schedule:
  - cron: '0 0 * * *' # Runs daily at midnight UTC
```

### Branch Naming

Modify the branch filtering logic if you use a different naming convention.

```javascript
// Example: Find branches starting with `issue-`
const claudeBranches = branches.data.filter(branch => 
  branch.name.startsWith(`issue-${issue.number}`)
);
```

## 4. Troubleshooting

### Workflow Not Running
- **Check Schedule**: Ensure the `cron` syntax is correct.
- **File Path**: Verify the workflow file is in `.github/workflows/`.

### Permission Errors
- **Token Permissions**: Confirm that `Read and write permissions` are enabled in `Settings` > `Actions` > `General`.
- **Branch Protection**: If you have branch protection rules, ensure the `github-actions` bot has permission to merge.

### Branch Not Found
- **Naming Convention**: Double-check that the branch name corresponds to the issue number and matches the logic in the workflow.
- **Push Delay**: Make sure the branch has been pushed to the remote repository before the workflow runs.

For further assistance, please open an issue in our repository.

# Troubleshooting Guide 🔧

Common issues and solutions for the Claude Smart Automation System.

## 🚨 Quick Diagnostics

### System Health Check
```bash
# Run comprehensive health check
npm run automation:health

# Check GitHub API connectivity
gh auth status

# Verify Claude Code CLI
claude-code --version
```

## 🔧 Common Issues

### 1. **Workflow Not Triggering**

#### Symptoms
- Issues created but no automation starts
- Workflows show as "skipped" in Actions tab
- No PR created despite having implementation branch

#### Solutions
```bash
# Check issue labels
gh issue view <issue-number> --json labels

# Verify required labels are present
# Required: claude-processed, claude-ready, or automation-ready

# Add missing labels
gh issue edit <issue-number> --add-label "claude-processed"
```

#### Common Causes
- ❌ Missing automation trigger labels
- ❌ Incorrect label names (case-sensitive)
- ❌ Workflow file syntax errors
- ❌ Repository permissions

### 2. **Permission Errors**

#### Symptoms
```
Error: Resource not accessible by integration
Error: Bad credentials
Error: API rate limit exceeded
```

#### Solutions
```bash
# Check GitHub token permissions
gh auth status

# Required permissions:
# - repo (full repository access)
# - workflow (workflow management)
# - actions (GitHub Actions access)

# Refresh authentication
gh auth refresh -h github.com -s repo,workflow,actions
```

#### GitHub Actions Permissions
1. Go to `Settings` > `Actions` > `General`
2. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"

### 3. **Branch Detection Issues**

#### Symptoms
- "No matching branch found" in workflow logs
- Automation skips issues with existing branches
- Wrong branch selected for PR creation

#### Solutions
```bash
# Check branch naming patterns
git branch -r | grep issue-<number>

# Supported patterns:
# - issue-123
# - claude-123
# - feature/issue-123
# - fix/issue-123
# - claude/issue-123
# - automation-123
```

#### Create Properly Named Branch
```bash
# For issue #123, use one of these patterns:
git checkout -b issue-123
git checkout -b claude-123
git checkout -b feature/issue-123
```

### 4. **Claude Code CLI Issues**

#### Symptoms
- "claude-code command not found"
- "Authentication failed"
- "Model not available"

#### Solutions
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify installation
claude-code --version

# For Claude Code Max users (no API key needed)
# Ensure you're using the correct model
export CLAUDE_MODEL="claude-3-sonnet-20240229"
```

### 5. **API Rate Limits**

#### Symptoms
```
Error: API rate limit exceeded
Error: You have exceeded a secondary rate limit
```

#### Solutions
```bash
# Check current rate limit status
gh api rate_limit

# Wait for rate limit reset (shown in response)
# Or implement exponential backoff in workflows

# Optimize workflow frequency
# - Ultimate: Every minute (high usage)
# - Rapid: Every 5 minutes (medium usage)  
# - Smart: Scheduled (low usage)
```

### 6. **Security Check Failures**

#### Symptoms
- PRs blocked by security checks
- "Malicious code detected" warnings
- Quality gate failures

#### Solutions
```bash
# Review security patterns that failed
# Check workflow logs for specific patterns

# Common false positives:
# - eval() in test files
# - exec() in build scripts
# - Dynamic imports in legitimate code

# Whitelist legitimate patterns in workflow
```

### 7. **Merge Conflicts**

#### Symptoms
- "Merge conflict detected"
- PR cannot be auto-merged
- Branch behind main branch

#### Solutions
```bash
# Update branch with latest main
git checkout <branch-name>
git fetch origin
git merge origin/main

# Resolve conflicts manually
git add .
git commit -m "Resolve merge conflicts"
git push origin <branch-name>
```

## 🔍 Advanced Debugging

### Enable Debug Logging
```yaml
# Add to workflow environment
env:
  RUNNER_DEBUG: 1
  ACTIONS_STEP_DEBUG: 1
  DEBUG: true
```

### Workflow Logs Analysis
```bash
# View recent workflow runs
gh run list --workflow="claude-code-automation.yml" --limit 10

# Get detailed logs
gh run view <run-id> --log

# Download logs for offline analysis
gh run download <run-id>
```

### Manual Workflow Testing
```bash
# Trigger workflow manually
gh workflow run claude-code-automation.yml

# Trigger with specific inputs
gh workflow run claude-code-automation.yml \
  --field issue_number=123 \
  --field force_run=true
```

## 📊 Performance Issues

### Slow Workflow Execution

#### Symptoms
- Workflows taking longer than expected
- Timeouts in GitHub Actions
- High resource usage

#### Solutions
```bash
# Check workflow execution time
gh run list --workflow="claude-code-automation.yml" --json conclusion,createdAt,updatedAt

# Optimize workflow:
# 1. Reduce security pattern checks for trusted repos
# 2. Use caching for dependencies
# 3. Parallelize independent steps
```

### High GitHub Actions Usage

#### Symptoms
- Approaching monthly Actions limit
- Unexpected billing charges
- Workflows queued due to concurrency limits

#### Solutions
```bash
# Monitor usage
gh api /repos/:owner/:repo/actions/billing/usage

# Optimize schedule:
# - Switch from Ultimate to Rapid or Smart tier
# - Reduce workflow frequency
# - Use conditional execution
```

## 🛠️ Configuration Issues

### Environment Variables

#### Check Current Configuration
```bash
# List all secrets
gh secret list

# Required secrets:
# - GITHUB_TOKEN (usually automatic)
# - ANTHROPIC_API_KEY (not needed for Claude Code Max)
```

#### Update Configuration
```bash
# Set repository secret
gh secret set GITHUB_TOKEN --body "your-token-here"

# Set environment variable
export GITHUB_TOKEN="your-token-here"
```

### Workflow File Syntax

#### Validate YAML Syntax
```bash
# Use online YAML validator or
python -c "import yaml; yaml.safe_load(open('.github/workflows/claude-code-automation.yml'))"
```

#### Common Syntax Issues
- ❌ Incorrect indentation (use spaces, not tabs)
- ❌ Missing quotes around special characters
- ❌ Invalid cron expressions
- ❌ Incorrect job dependencies

## 🆘 Getting Help

### Self-Service Resources
1. **Check Logs**: Always start with workflow logs
2. **Review Documentation**: [Complete docs](README.md)
3. **Search Issues**: [GitHub Issues](https://github.com/takezou621/claude-automation/issues)
4. **Community Discussions**: [GitHub Discussions](https://github.com/takezou621/claude-automation/discussions)

### Reporting Issues

#### Information to Include
```bash
# System information
node --version
npm --version
gh --version
claude-code --version

# Workflow information
gh run view <run-id> --json

# Repository information
gh repo view --json
```

#### Issue Template
```markdown
## Problem Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version:
- GitHub CLI version:
- Claude Code CLI version:
- Automation tier:

## Logs
```
Paste relevant logs here
```

## Additional Context
Any other relevant information
```

### Emergency Procedures

#### Stop All Automation
```bash
# Disable all workflows
gh workflow disable claude-code-automation.yml
gh workflow disable claude-code-review.yml
gh workflow disable claude-issue-processor.yml
```

#### Rollback Changes
```bash
# Revert to previous workflow version
git checkout HEAD~1 -- .github/workflows/
git commit -m "Rollback workflow changes"
git push origin main
```

## 📋 Preventive Measures

### Regular Maintenance
```bash
# Weekly health check
npm run automation:health

# Monthly usage review
gh api /repos/:owner/:repo/actions/billing/usage

# Quarterly configuration audit
npm run automation:config-check
```

### Best Practices
1. **Test in Development**: Always test workflow changes in a dev repository first
2. **Monitor Usage**: Keep track of GitHub Actions usage
3. **Regular Updates**: Keep dependencies and CLI tools updated
4. **Backup Configuration**: Store workflow configurations in version control
5. **Document Changes**: Keep a changelog of workflow modifications

---

## 🎯 Quick Reference

### Essential Commands
```bash
# Health check
npm run automation:health

# Manual trigger
gh workflow run claude-code-automation.yml

# View logs
gh run view <run-id> --log

# Check permissions
gh auth status

# List workflows
gh workflow list
```

### Support Channels
- 🐛 **Bugs**: [GitHub Issues](https://github.com/takezou621/claude-automation/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/takezou621/claude-automation/discussions)
- 📚 **Documentation**: [docs/README.md](README.md)
- 🚀 **Feature Requests**: [GitHub Issues](https://github.com/takezou621/claude-automation/issues)

---

*Last updated: January 17, 2025*
# Claude Smart Automation Setup Guide 🤖

[![RepairGPT Enhanced](https://img.shields.io/badge/RepairGPT-Enhanced-blue.svg)](../REPAIRGPT_INTEGRATION.md)
[![Validated](https://img.shields.io/badge/Tests-6%2F6%20Passing-brightgreen.svg)](../test_repairgpt_enhancements.js)

This guide provides instructions for setting up the RepairGPT-enhanced Claude Smart Automation System in your own repository.

## Prerequisites

- A GitHub repository with Actions enabled
- `gh` CLI installed and authenticated (`gh auth login`)
- Basic knowledge of Git and GitHub Actions
- **Claude Code Max** (No API Key Required)
- **GitHub Token** with repo and workflow permissions

## 🚀 Quick Setup (RepairGPT-Enhanced)

The easiest way to get started is by using our automated setup scripts that include all RepairGPT enhancements.

### Step 1: Clone Repository
```bash
git clone https://github.com/takezou621/claude-automation.git
cd claude-automation
```

### Step 2: Choose Your Automation Tier
Select the tier that best fits your needs (see [Workflow Selection Guide](workflow-selection-guide.md)):

```bash
# Ultimate - Maximum speed with all RepairGPT features
./scripts/setup-ultimate-automation.sh <owner> <repo>

# Full - Enterprise-grade with RepairGPT intelligence
./scripts/setup-full-automation.sh <owner> <repo>

# Rapid - Speed-optimized with RepairGPT enhancements
./scripts/setup-rapid-automation.sh <owner> <repo>

# Smart - Resource-efficient with RepairGPT patterns
./scripts/setup-smart-automation.sh <owner> <repo>
```

### Step 3: Interactive Setup
The script will guide you through:
- **Claude Code Max Setup**: Configure for API-key-free operation
- **GitHub Token Setup**: Configure repository access
- **RepairGPT Label Creation**: 25+ specialized labels
- **Workflow Deployment**: Multi-stage automation setup
- **Validation**: Test suite execution

### Example
```bash
./scripts/setup-full-automation.sh my-awesome-org my-project
```

This will set up enterprise-grade automation with complete RepairGPT feature integration.

---

## 🔧 Manual Setup (Advanced)

For advanced users who prefer manual configuration:

### Step 1: Deploy RepairGPT-Enhanced Workflows

Copy the enhanced workflow files to your repository:

```bash
# Core automation (choose one tier)
cp templates/claude-full-automation.yml <target-repo>/.github/workflows/
# OR
cp templates/claude-ultimate-automation.yml <target-repo>/.github/workflows/
# OR
cp templates/claude-rapid-automation.yml <target-repo>/.github/workflows/
# OR
cp templates/claude-smart-automation.yml <target-repo>/.github/workflows/

# Supporting workflows (recommended for all tiers)
cp .github/workflows/claude-issue-processor.yml <target-repo>/.github/workflows/
cp .github/workflows/claude-code-review.yml <target-repo>/.github/workflows/
```

### Step 2: Create RepairGPT-Enhanced Labels

The RepairGPT-enhanced system uses a comprehensive labeling system:

#### **Core Automation Labels**
- `claude-processed` - Standard automated processing
- `claude-ready` - Ready for automation
- `automation-ready` - General automation trigger
- `claude-issue-processor` - Issue processor handled
- `claude-full-automation` - Full automation pipeline

#### **RepairGPT Priority System**
- `priority:critical` - Immediate processing (auto-assigned)
- `priority:high` - High priority processing  
- `priority:medium` - Standard priority
- `priority:low` - Low priority processing
- `urgent` - Urgent issue handling
- `hotfix` - Emergency fix processing

#### **Quality & Security Labels**
- `security-review` - Security-focused validation
- `quality:gold` - Highest quality requirements
- `quality:silver` - Standard quality requirements
- `quality:bronze` - Basic quality requirements
- `complexity:high` - Complex issue marking
- `complexity:medium` - Medium complexity
- `complexity:low` - Simple issue

#### **Process Stage Labels**
- `stage:detection` - Issue detection phase
- `stage:implementation` - Implementation phase
- `stage:review` - Review phase
- `stage:completed` - Process completed
- `claude-completed` - Successfully automated
- `automation-failed` - Requires manual intervention
- `stale` - Old issue detection

#### **Performance Labels**
- `perf:sub-minute` - Sub-minute processing
- `perf:fast` - Fast processing
- `perf:standard` - Standard processing

### Step 3: Configure Repository Secrets

Set up the required secrets in your repository (`Settings` > `Secrets and variables` > `Actions`):

```bash
# Required secrets
# ANTHROPIC_API_KEY=not_required_for_claude_code_max
GITHUB_TOKEN=your_github_token_here  # Usually provided automatically
```

**Note**: Claude Code Max users do not need to set `ANTHROPIC_API_KEY`.

### Step 4: Configure Repository Settings

1. **Workflow Permissions**:
   - Go to `Settings` > `Actions` > `General`
   - Under `Workflow permissions`, select `Read and write permissions`
   - Enable `Allow GitHub Actions to create and approve pull requests`

2. **Branch Protection** (Optional but recommended):
   - Set up branch protection rules for `main`
   - Enable required status checks
   - Configure auto-merge settings

### Step 5: Create Labels via Script

Use the advanced label creation script:

```bash
./scripts/create-advanced-labels.sh <owner> <repo>
```

This creates all 25+ RepairGPT-enhanced labels automatically.

---

## 🧪 Validation & Testing

### Step 1: Run Enhancement Tests
Validate your RepairGPT integration:

```bash
cd <your-repository>
node ../claude-automation/test_repairgpt_enhancements.js
```

Expected output:
```
✅ Security Patterns: 7/7 patterns verified
✅ Label System: 7/7 RepairGPT labels integrated  
✅ Quality Review: 8/8 quality checks implemented
✅ workflow_run Triggers: Multi-stage orchestration working
✅ Issue Processor: Full automation pipeline functional
✅ Intelligent Scheduling: RepairGPT timing patterns active

📊 Results: 6/6 tests passed
🎉 All RepairGPT enhancements successfully implemented!
```

### Step 2: Create Test Issue

Test your setup with a sample issue:

```bash
gh issue create --title "Test RepairGPT automation" \
  --body "This is a test issue for RepairGPT-enhanced automation. @claude please implement a simple test feature." \
  --label "claude-processed,priority:high,automation-ready"
```

### Step 3: Monitor Automation

Watch the automation in action:

```bash
# View workflow runs
gh run list --workflow="claude-full-automation.yml" --limit 5

# View detailed logs
gh run view <run-id> --log

# Check issue status
gh issue list --label="claude-processed"
```

---

## 🔍 Troubleshooting

### Common Issues

1. **API Key Issues**
   ```bash
   # Verify API key is set
   gh secret list
   
   # Test Claude Code CLI
   claude-code --version
   ```

2. **Permission Errors**
   - Ensure `Read and write permissions` are enabled
   - Check `GITHUB_TOKEN` has appropriate scopes
   - Verify repository collaborator permissions

3. **Workflow Not Triggering**
   - Check label names match exactly
   - Verify issue has correct labels applied
   - Review workflow trigger conditions

4. **RepairGPT Features Not Working**
   ```bash
   # Run validation tests
   node test_repairgpt_enhancements.js
   
   # Check workflow syntax
   gh workflow list
   ```

### Debug Mode

Enable verbose logging by adding to workflow environment:

```yaml
env:
  RUNNER_DEBUG: 1
  ACTIONS_STEP_DEBUG: 1
```

---

## 📊 Performance Optimization

### GitHub Actions Usage

Monitor and optimize your Actions usage:

| Tier | Monthly Usage (Est.) | Best For |
|------|---------------------|----------|
| Ultimate | High (2000+ min/month) | Critical projects |
| Full | Medium-High (1000+ min/month) | Enterprise projects |
| Rapid | Medium (500+ min/month) | Active development |
| Smart | Low (100+ min/month) | Standard projects |

### Optimization Tips

1. **Use Smart Scheduling**: RepairGPT patterns optimize for timezone efficiency
2. **Label Management**: Use specific labels to control automation scope
3. **Workflow Combination**: Mix tiers for different issue types
4. **Regular Monitoring**: Review usage and adjust as needed

---

## 🔄 Migration Guide

### From Standard to RepairGPT-Enhanced

If upgrading from a basic automation setup:

1. **Backup Current Setup**:
   ```bash
   cp .github/workflows/existing-workflow.yml backup/
   ```

2. **Run Migration Script**:
   ```bash
   ./scripts/migrate-to-repairgpt.sh <owner> <repo>
   ```

3. **Update Labels**:
   - Add new RepairGPT labels
   - Update existing issue labels
   - Configure priority system

4. **Test Integration**:
   - Run validation tests
   - Create test issues
   - Monitor initial runs

---

## 🎯 Next Steps

Once setup is complete:

1. **Read the [Usage Guide](usage.md)** - Learn how to use RepairGPT features
2. **Review [Workflow Selection Guide](workflow-selection-guide.md)** - Optimize your tier choice
3. **Check [RepairGPT Integration Guide](../REPAIRGPT_INTEGRATION.md)** - Understand all enhancements
4. **Monitor Performance** - Track automation effectiveness
5. **Customize as Needed** - Adapt workflows to your team's needs

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/takezou621/claude-automation/issues)
- **Documentation**: [Full Documentation](../README.md)
- **RepairGPT Analysis**: [Integration Report](../REPAIRGPT_INTEGRATION.md)
- **Community**: [Discussions](https://github.com/takezou621/claude-automation/discussions)

---

**🤖 Powered by RepairGPT-Enhanced Technology** | **Enterprise-Grade Setup**
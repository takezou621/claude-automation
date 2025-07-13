# Claude Smart Automation System

## 🚀 Overview

This is a smart automation system that leverages the power of large language models to fully automate the development workflow. It handles everything from issue creation and code implementation to pull request management, merging, and closing issues.

## ✨ Features

- **100% Fully Automated**: A complete, hands-off workflow from start to finish.
- **Smart Scheduling**: Executes tasks at optimal times, configurable for your team's needs.
- **GitHub Actions Integration**: Secure and reliable automation using native GitHub features.
- **Robust Error Handling**: Comes with solid exception handling and logging.

## 📋 What It Does

1.  **Issue Detection**: Automatically detects issues labeled for processing (e.g., `claude-processed`).
2.  **Branch Discovery**: Finds the corresponding implementation branch for an issue.
3.  **PR Creation**: Automatically creates a Pull Request.
4.  **Auto-Merge**: Merges the PR instantly after checks pass.
5.  **Issue Completion**: Closes the issue and applies relevant labels.
6.  **Cleanup**: Deletes the branch after merging.

## ⏰ Execution Schedule

The schedule is fully customizable. By default, it runs at regular intervals, but you can configure it to match your team's workflow. Here is a recommended universal schedule using UTC:

```yaml
schedule:
  # Every 6 hours
  - cron: '0 */6 * * *'
```

This ensures the automation runs consistently for a globally distributed team.

## 🛠️ Setup

### Quick Setup

```bash
# Run the setup script
./scripts/setup-smart-automation.sh <owner> <repo>
```

### Manual Setup

For detailed instructions, please refer to our [Setup Guide](docs/smart-automation-setup-guide.md).

## 📊 Usage

### 1. Create an Issue

```bash
gh issue create --title "Feature: Implement new login flow" \
  --body "@claude Please implement this feature." \
  --label "claude-processed,priority:high"
```

### 2. AI Implementation

1.  The AI or a developer creates a new branch for the implementation.
2.  Code the feature.
3.  Commit and push the changes.

### 3. Automated Workflow

The system runs on its schedule. You can also trigger it manually:

```bash
gh workflow run claude-smart-automation.yml
```

## 📂 File Structure

```
.
├── .github/workflows/
│   └── claude-smart-automation.yml    # Main workflow
├── docs/
│   └── smart-automation-setup-guide.md # Detailed setup guide
├── scripts/
│   └── setup-smart-automation.sh       # Automated setup script
├── templates/
│   └── claude-smart-automation.yml     # Workflow template
└── README.md                           # This file
```

## 🔧 Customization

### Changing the Schedule

Edit the `cron` setting in `.github/workflows/claude-smart-automation.yml`.

### Branch Naming Conventions

Adjust the branch search logic in the workflow file to match your team's conventions.

## 🔍 Monitoring & Troubleshooting

### Check Run Logs

```bash
# List recent workflow runs
gh run list --workflow="claude-smart-automation.yml" --limit 5

# View a specific run log
gh run view <run-id> --log
```

### Common Issues

1.  **Permission Errors**: Check the permissions for GitHub Actions in your repository settings.
2.  **Branch Not Found**: Ensure your branch naming convention matches the workflow configuration.
3.  **Missing Labels**: Make sure the required labels exist in your repository.

See the [Troubleshooting Guide](docs/smart-automation-setup-guide.md#troubleshooting) for more details.

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request or open an Issue for bugs, feature requests, or improvements. Check out our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

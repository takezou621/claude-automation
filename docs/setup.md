# Setup Guide

This guide provides instructions for setting up the Claude Smart Automation System in your own repository.

## Prerequisites

- A GitHub repository
- `gh` CLI installed and authenticated
- Basic knowledge of Git and GitHub Actions

## Quick Setup (Recommended)

The easiest way to get started is by using the automated setup script.

1.  **Clone this repository:**

    ```bash
    git clone https://github.com/your-username/claude-automation.git
    cd claude-automation
    ```

2.  **Run the script:**

    Provide your GitHub username (or organization) and the name of the repository where you want to set up the automation.

    ```bash
    ./scripts/setup-smart-automation.sh <owner> <repo>
    ```

    For example:

    ```bash
    ./scripts/setup-smart-automation.sh my-awesome-org my-project
    ```

    The script will automatically create the necessary labels and copy the workflow file to your repository.

## Manual Setup

If you prefer to set up the system manually, follow these steps:

1.  **Copy the Workflow File:**

    Copy the main workflow file from `templates/claude-smart-automation.yml` to the `.github/workflows/` directory in your target repository.

2.  **Create Required Labels:**

    The automation relies on specific labels to function correctly. Create the following labels in your repository settings (`Settings` > `Labels`):

    -   `claude-processed`: Used to identify issues ready for automated processing.
    -   `claude-completed`: Applied to issues that have been successfully processed and closed.
    -   `claude-failed`: Applied if the automation encounters an error.
    -   `priority:high`
    -   `priority:medium`
    -   `priority:low`

3.  **Configure Repository Settings:**

    -   Go to your repository's `Settings` > `Actions` > `General`.
    -   Under `Workflow permissions`, ensure that `Read and write permissions` is selected. This allows the workflow to create PRs, merge branches, and close issues.

## Next Steps

Once the setup is complete, you can start using the automation by creating issues with the `claude-processed` label. For more details on how to use the system, refer to the [Usage Guide](usage.md).

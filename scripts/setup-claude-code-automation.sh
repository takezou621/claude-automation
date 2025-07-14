#!/bin/bash

# Claude Code Full Automation Setup Script
# This script sets up complete Issue-to-Code automation using Claude Code CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required arguments are provided
if [ $# -ne 2 ]; then
    print_error "Usage: $0 <owner> <repo>"
    print_error "Example: $0 takezou621 my-project"
    exit 1
fi

OWNER=$1
REPO=$2

print_status "🚀 Setting up Claude Code Full Automation for ${OWNER}/${REPO}"

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first:"
    print_error "https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    print_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
    exit 1
fi

# Verify repository exists
print_status "Verifying repository ${OWNER}/${REPO}..."
if ! gh repo view "${OWNER}/${REPO}" &> /dev/null; then
    print_error "Repository ${OWNER}/${REPO} not found or not accessible."
    exit 1
fi

print_success "Repository verified!"

# Create required labels
print_status "Creating automation labels..."

LABELS=(
    "claude-processed:0052CC:Issues ready for Claude Code automation"
    "claude-ready:0052CC:Ready for automated implementation"
    "automation-ready:0052CC:General automation ready"
    "claude-code-ready:0052CC:Specifically ready for Claude Code CLI"
    "claude-completed:28A745:Successfully automated by Claude Code"
    "claude-code-automated:28A745:Automated using Claude Code CLI"
    "fully-automated:28A745:Complete end-to-end automation"
    "automation-failed:DC3545:Automation attempt failed"
)

for label in "${LABELS[@]}"; do
    IFS=':' read -r name color description <<< "$label"
    
    if gh label list -R "${OWNER}/${REPO}" | grep -q "^${name}"; then
        print_warning "Label '${name}' already exists, skipping..."
    else
        gh label create "${name}" --color "${color}" --description "${description}" -R "${OWNER}/${REPO}"
        print_success "Created label: ${name}"
    fi
done

# Set up secrets
print_status "Setting up repository secrets..."

# Prompt for ANTHROPIC_API_KEY
echo ""
print_status "Claude Code automation requires an Anthropic API key."
print_status "You can get one from: https://console.anthropic.com/"
echo ""
read -s -p "Enter your Anthropic API key: " ANTHROPIC_API_KEY
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_error "Anthropic API key is required for Claude Code automation."
    exit 1
fi

# Set the secret
print_status "Setting ANTHROPIC_API_KEY secret..."
echo "$ANTHROPIC_API_KEY" | gh secret set ANTHROPIC_API_KEY -R "${OWNER}/${REPO}"
print_success "ANTHROPIC_API_KEY secret set successfully!"

# Copy the Claude Code automation workflow
print_status "Installing Claude Code automation workflow..."

WORKFLOW_SOURCE="../.github/workflows/claude-code-automation.yml"
WORKFLOW_TARGET=".github/workflows/claude-code-automation.yml"

# Create .github/workflows directory if it doesn't exist
mkdir -p .github/workflows

# Copy workflow file
if [ -f "$WORKFLOW_SOURCE" ]; then
    cp "$WORKFLOW_SOURCE" "$WORKFLOW_TARGET"
    print_success "Claude Code automation workflow installed!"
else
    print_error "Workflow source file not found: $WORKFLOW_SOURCE"
    print_error "Please ensure you're running this script from the claude-automation repository."
    exit 1
fi

# Create Claude Code configuration file
print_status "Creating Claude Code configuration..."

cat > .claude-config.yml << EOF
# Claude Code Automation Configuration
automation:
  enabled: true
  max_issues_per_run: 5
  timeout_minutes: 10
  
issue_analysis:
  auto_classify: true
  complexity_threshold: 500  # characters in issue body
  
code_generation:
  include_tests: true
  include_docs: true
  follow_conventions: true
  
security:
  scan_generated_code: true
  block_sensitive_operations: true
  
workflow:
  auto_merge: true
  auto_close_issues: true
  cleanup_branches: true
  
labels:
  ready: ["claude-processed", "claude-ready", "automation-ready", "claude-code-ready"]
  completed: ["claude-completed", "claude-code-automated", "fully-automated"]
  failed: ["automation-failed"]
EOF

print_success "Claude Code configuration created!"

# Commit and push the workflow if we're in a git repository
if [ -d ".git" ]; then
    print_status "Committing automation setup..."
    
    git add .github/workflows/claude-code-automation.yml .claude-config.yml
    git commit -m "feat: Add Claude Code full automation

- Implement complete Issue-to-Code automation
- Add Claude Code CLI integration
- Include intelligent issue analysis
- Support automatic code generation
- Enable end-to-end workflow automation

🤖 Claude Code Full Automation Setup"
    
    git push origin main
    print_success "Automation setup committed and pushed!"
fi

# Enable workflow
print_status "Enabling the automation workflow..."
gh workflow enable claude-code-automation.yml -R "${OWNER}/${REPO}"
print_success "Claude Code automation workflow enabled!"

# Summary
echo ""
print_success "🎉 Claude Code Full Automation Setup Complete!"
echo ""
print_status "📋 What's been configured:"
echo "  ✅ Repository labels for automation tracking"
echo "  ✅ ANTHROPIC_API_KEY secret for Claude Code CLI"
echo "  ✅ Claude Code automation workflow"
echo "  ✅ Configuration file for automation settings"
echo "  ✅ Workflow enabled and ready to run"
echo ""
print_status "🚀 How to use:"
echo "  1. Create an issue in your repository"
echo "  2. Add the 'claude-processed' label to the issue"
echo "  3. The automation will:"
echo "     - Analyze the issue requirements"
echo "     - Generate code using Claude Code CLI"
echo "     - Create a branch and commit changes"
echo "     - Open a pull request"
echo "     - Auto-merge after validation"
echo "     - Close the issue and clean up"
echo ""
print_status "⏰ Automation schedule:"
echo "  - Weekdays: 23:00, 02:00, 05:00 JST"
echo "  - Weekends: 10:00, 14:00, 18:00, 22:00 JST"
echo "  - Manual trigger: gh workflow run claude-code-automation.yml"
echo ""
print_status "🔧 Configuration file: .claude-config.yml"
print_status "📖 For more information, visit: https://github.com/takezou621/claude-automation"
echo ""
print_warning "⚠️  Important notes:"
echo "  - Ensure your ANTHROPIC_API_KEY has sufficient credits"
echo "  - Review generated code before auto-merge in production"
echo "  - Monitor automation logs for any issues"
echo "  - Consider rate limits for high-frequency usage"
echo ""
print_success "Happy automating! 🤖✨"
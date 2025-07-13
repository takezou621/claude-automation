#!/bin/bash

# Claude Full Automation Setup Script (RepairGPT Enhanced)
# RepairGPT調査結果を基にした包括的自動化システムセットアップ

set -e

# Colors for enhanced output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_full() {
    echo -e "${PURPLE}[FULL-AUTO]${NC} $1"
}

log_header() {
    echo -e "${WHITE}[HEADER]${NC} $1"
}

# Check arguments
if [ "$#" -ne 2 ]; then
    log_error "Usage: $0 <owner> <repo>"
    log_info "Example: $0 username my-repo"
    exit 1
fi

OWNER=$1
REPO=$2

log_header "🚀 CLAUDE FULL AUTOMATION SYSTEM SETUP"
log_full "Repository: ${OWNER}/${REPO}"
log_full "📊 RepairGPT Enhanced Technology Integration"

# ASCII Art Banner
cat << 'EOF'
   _____ _                 _        ______      _ _       _         _                        _   _             
  / ____| |               | |      |  ____|    | | |     / \      | |                      | | (_)            
 | |    | | __ _ _   _  ___| | ___  | |__ _   _ | | |    /   \  _  | |_ ___  _ __ ___   __ _| |_ _  ___  _ __  
 | |    | |/ _` | | | |/ _ \ |/ _ \ |  __| | | || | |   / /_\ \| | | __/ _ \| '_ ` _ \ / _` | __| |/ _ \| '_ \ 
 | |____| | (_| | |_| |  __/ |  __/ | |  | |_| || | |  / _____ \ |_| || (_) | | | | | | (_| | |_| | (_) | | | |
  \_____|_|\__,_|\__,_|\___|_|\___| |_|   \__,_||_|_| /_/     \_\__/ \__\___/|_| |_| |_|\__,_|\__|_|\___/|_| |_|
                                                                                                               
EOF

echo -e "${PURPLE}🔥 RepairGPT Enhanced | Next Generation AI Development${NC}"
echo ""

# GitHub CLI verification
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) not installed"
    log_info "Install: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI authentication required"
    log_info "Run: gh auth login"
    exit 1
fi

log_success "GitHub CLI authentication verified"

# Step 1: Enhanced GitHub Actions Permissions
log_header "📋 Step 1: Enhanced GitHub Actions Permissions"

log_info "Checking current permission configuration..."
CURRENT_PERMISSIONS=$(gh api repos/${OWNER}/${REPO}/actions/permissions/workflow 2>/dev/null || echo "ERROR")

if [ "$CURRENT_PERMISSIONS" = "ERROR" ]; then
    log_error "Cannot access repository permissions"
    exit 1
fi

echo "Current settings: $CURRENT_PERMISSIONS"

log_info "Configuring enhanced permissions for full automation..."
gh api --method PUT repos/${OWNER}/${REPO}/actions/permissions/workflow \
  --field default_workflow_permissions=write \
  --field can_approve_pull_request_reviews=true

# Verify permission changes
NEW_PERMISSIONS=$(gh api repos/${OWNER}/${REPO}/actions/permissions/workflow)
echo "New settings: $NEW_PERMISSIONS"

if [[ $NEW_PERMISSIONS == *'"default_workflow_permissions":"write"'* ]]; then
    log_success "Enhanced GitHub Actions permissions configured"
else
    log_error "Permission configuration failed"
    exit 1
fi

# Step 2: Advanced Workflow Deployment
log_header "📋 Step 2: Advanced Workflow Deployment"

mkdir -p .github/workflows

# Deploy all RepairGPT enhanced workflows
WORKFLOWS=(
    "claude-full-automation.yml:Full Automation Engine"
    "claude-ultimate-automation.yml:Ultimate Automation"
    "claude-rapid-automation.yml:Rapid Automation"
    "claude-smart-automation.yml:Smart Automation"
    "claude-code-review.yml:AI Code Review"
    "claude-issue-processor.yml:Issue Processor"
)

for workflow_info in "${WORKFLOWS[@]}"; do
    IFS=':' read -r workflow_file workflow_name <<< "$workflow_info"
    
    TEMPLATE_FILE="workflows/${workflow_file}"
    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_warning "Template not found: $TEMPLATE_FILE, skipping"
        continue
    fi
    
    cp "$TEMPLATE_FILE" .github/workflows/
    log_success "Deployed: $workflow_name"
done

log_full "🚀 Advanced workflow deployment complete"

# Step 3: RepairGPT Enhanced Label System
log_header "📋 Step 3: RepairGPT Enhanced Label System"

# Run the advanced label creation script
if [ -f "scripts/create-advanced-labels.sh" ]; then
    log_info "Deploying RepairGPT enhanced label system..."
    bash scripts/create-advanced-labels.sh "$OWNER" "$REPO"
    log_full "🏷️ Enhanced label system deployed"
else
    log_warning "Advanced label script not found, creating basic labels..."
    
    # Basic fallback labels
    gh label create "claude-processed" --description "Claude Code processed" --color "1d76db" 2>/dev/null || true
    gh label create "claude-ready" --description "Ready for automation" --color "0052cc" 2>/dev/null || true
    gh label create "fully-automated" --description "100% automated" --color "ff4500" 2>/dev/null || true
    gh label create "claude-completed" --description "Automation completed" --color "0e8a16" 2>/dev/null || true
fi

# Step 4: Advanced Test Issue Creation
log_header "📋 Step 4: Advanced Test Issue Creation"

# Create comprehensive test issues
log_info "Creating advanced test scenarios..."

# Ultimate Automation Test
ULTIMATE_ISSUE=$(gh issue create \
  --title "🔥 Ultimate Test: Advanced Calculator Implementation" \
  --body "## 🚀 Ultimate Automation Test Suite

**Objective:** Test full automation capabilities with complex implementation

### 📋 Requirements
- [ ] Create \`advanced_calculator.py\` with comprehensive functions
- [ ] Implement basic arithmetic operations (+, -, *, /)
- [ ] Add advanced operations (power, square root, factorial)
- [ ] Include error handling and input validation
- [ ] Add comprehensive docstrings and type hints
- [ ] Create unit tests for all functions

### 🎯 Expected Automation Flow
1. **Detection:** Issue labeled for ultimate automation
2. **Implementation:** Claude Code creates comprehensive solution
3. **PR Creation:** Full automation creates detailed PR
4. **Review:** AI code review validates implementation
5. **Merge:** Lightning-fast auto-merge
6. **Closure:** Complete issue closure with metrics

### 🏷️ Labels
- Priority: Ultimate
- Complexity: High
- Automation: Full

@claude Please implement this advanced calculator with full test coverage!" \
  --label "claude-processed,priority:ultimate,ultimate-automation,complexity:high")

log_success "Ultimate test issue created: $ULTIMATE_ISSUE"

# Full Automation Test
FULL_ISSUE=$(gh issue create \
  --title "⚡ Full Automation Test: String Utilities Library" \
  --body "## 🚀 Full Automation Test

**Objective:** Test RepairGPT enhanced automation features

### 📋 Implementation Requirements
- [ ] Create \`string_utils.py\` library
- [ ] Implement text manipulation functions
- [ ] Add string validation utilities
- [ ] Include performance optimizations
- [ ] Add comprehensive documentation

### 🎯 Automation Features to Test
- ✅ Intelligent issue processing
- ✅ Advanced branch detection
- ✅ Enhanced PR templates
- ✅ AI code review integration
- ✅ Quality metrics tracking
- ✅ Complete automation lifecycle

### 🏷️ Automation Labels
Applied automatically by issue processor

@claude Full automation implementation requested!" \
  --label "claude-ready,automation-ready,fully-automated")

log_success "Full automation test issue created: $FULL_ISSUE"

# Code Review Test PR
log_info "Setting up code review test scenario..."

# Create a test branch for code review
git checkout -b test/code-review-$(date +%s) 2>/dev/null || true

cat > test_file.py << 'EOF'
# Test file for AI code review
import os

def unsafe_function():
    password = "hardcoded_password"  # Security issue
    api_key = "sk-1234567890"        # Security issue
    print("Debug info")              # Debug code
    
    # TODO: Fix this function        # Code quality issue
    var temp = "should use let"      # Best practice issue
    
    return temp

# FIXME: Remove this              # Code quality issue
def good_function():
    """Properly documented function"""
    return "This is fine"
EOF

git add test_file.py
git commit -m "test: Add file for code review testing" 2>/dev/null || true
git push -u origin test/code-review-$(date +%s) 2>/dev/null || true

log_success "Code review test setup complete"

# Step 5: Repository Configuration
log_header "📋 Step 5: Repository Configuration"

# Enable GitHub Pages (if applicable)
log_info "Configuring repository settings..."

# Set repository topics
gh repo edit --add-topic "claude-automation"
gh repo edit --add-topic "ai-development"
gh repo edit --add-topic "repairgpt-enhanced"
gh repo edit --add-topic "full-automation"

log_success "Repository topics configured"

# Step 6: Setup Completion Verification
log_header "📋 Step 6: Setup Completion Verification"

log_info "Verifying installation..."

# Check workflows
WORKFLOW_COUNT=$(ls .github/workflows/claude-*.yml 2>/dev/null | wc -l)
log_info "Workflows deployed: $WORKFLOW_COUNT"

# Check labels
LABEL_COUNT=$(gh label list --limit 50 | grep -c "claude\|automation\|priority" || echo "0")
log_info "Automation labels created: $LABEL_COUNT"

# Generate completion report
cat << EOF

🎉 CLAUDE FULL AUTOMATION SYSTEM DEPLOYMENT COMPLETE!

📊 Deployment Summary:
├── 🚀 Workflows Deployed: $WORKFLOW_COUNT advanced automation workflows
├── 🏷️ Labels Created: $LABEL_COUNT automation and management labels  
├── 🎯 Test Issues: 2 comprehensive test scenarios
├── 🔧 Permissions: Enhanced GitHub Actions permissions
└── ⚙️ Configuration: Repository optimized for automation

🚀 RepairGPT Enhanced Features:
├── ⚡ Full Automation Engine (RepairGPT inspired)
├── 🤖 AI Code Review System (Advanced analysis)
├── 🔄 Issue Processor (Intelligent categorization)
├── 🎯 Ultimate Automation (Lightning-fast processing)
├── ⚡ Rapid Automation (5-minute intervals)
└── 🧠 Smart Automation (Timezone-optimized)

⏰ Automation Schedules:
├── 🌙 Weekdays: 23:00, 02:00, 05:00 JST (Night automation)
├── ☀️ Weekends: 10:00, 14:00, 18:00, 22:00 JST (Day automation)
├── ⚡ Rapid: Every 5 minutes (rapid-process issues)
├── 🔥 Ultimate: Every minute (ultimate-automation issues)
└── 🔄 Issue Processing: Every 15 minutes

🎯 Next Steps:
1. 📝 Create issues with automation labels
2. 🚀 Run manual workflow tests:
   gh workflow run claude-full-automation.yml
3. 📊 Monitor automation execution:
   gh run list --workflow="claude-full-automation.yml"
4. 🔍 Review AI code review results on PRs
5. 📈 Check issue processing automation

💡 Testing Commands:
# Manual workflow execution
gh workflow run claude-full-automation.yml
gh workflow run claude-ultimate-automation.yml
gh workflow run claude-issue-processor.yml

# Monitor execution
gh run list --limit 10
gh run view <run-id> --log

# Check automation results
gh issue list --label "claude-completed"
gh pr list --label "claude-auto-generated"

🔗 Repository: https://github.com/${OWNER}/${REPO}
📚 Documentation: docs/workflow-selection-guide.md

EOF

log_full "🎯 Full Automation System ready for production use!"
log_success "🚀 RepairGPT enhanced technology successfully integrated!"

# Final verification
if [ "$WORKFLOW_COUNT" -ge 4 ] && [ "$LABEL_COUNT" -ge 10 ]; then
    log_success "✅ All systems operational - Full automation ready!"
    exit 0
else
    log_warning "⚠️ Some components may need attention - check above output"
    exit 1
fi
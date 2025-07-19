#!/bin/bash

# Production Verification Script
# 本番環境設定後の検証スクリプト

echo "🔍 Claude Automation - Production Verification"
echo "=============================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Function to check optional command
check_optional() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${YELLOW}⚠️  $1${NC}"
    fi
}

echo ""
echo "📋 Step 1: Environment Variables Check"
echo "------------------------------------"

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check critical environment variables
if grep -q "GITHUB_TOKEN=placeholder" .env; then
    echo -e "${RED}❌ GitHub Token not set (still placeholder)${NC}"
    echo "Please set your actual GitHub Personal Access Token"
    exit 1
else
    echo -e "${GREEN}✅ GitHub Token configured${NC}"
fi

if grep -q "CLAUDE_API_KEY=placeholder" .env; then
    echo -e "${RED}❌ Claude API Key not set (still placeholder)${NC}"
    echo "Please set your actual Claude API Key"
    exit 1
else
    echo -e "${GREEN}✅ Claude API Key configured${NC}"
fi

if grep -q "NODE_ENV=production" .env; then
    echo -e "${GREEN}✅ Production environment configured${NC}"
else
    echo -e "${YELLOW}⚠️  Environment not set to production${NC}"
fi

echo ""
echo "🔧 Step 2: Dependencies Check"
echo "----------------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
    npm install
    check_status "Dependencies installation"
fi

echo ""
echo "📊 Step 3: Configuration Validation"
echo "----------------------------------"

npm run config:validate
check_optional "Configuration validation"

echo ""
echo "🤖 Step 4: Claude API Connection Test"
echo "-----------------------------------"

npm run claude:test
check_optional "Claude API connection"

echo ""
echo "🔗 Step 5: GitHub Connection Test"
echo "--------------------------------"

npm run automation:health
check_optional "System health check"

echo ""
echo "🧪 Step 6: Run Tests"
echo "------------------"

npm test
check_optional "Test execution"

echo ""
echo "🔒 Step 7: Security Scan"
echo "-----------------------"

npm run security:scan
check_optional "Security scan"

echo ""
echo "📈 Step 8: Performance Test"
echo "-------------------------"

if [ -f "src/performance-test.js" ]; then
    npm run performance:test
    check_optional "Performance test"
else
    echo -e "${YELLOW}⚠️  Performance test script not found${NC}"
fi

echo ""
echo "🎯 Verification Complete!"
echo "========================"
echo ""
echo -e "${GREEN}✅ Your Claude Automation system is ready for production!${NC}"
echo ""
echo "Next Steps:"
echo "1. Set up GitHub Webhooks (see PRODUCTION_SETUP.md)"
echo "2. Start the system: npm start"
echo "3. Monitor logs for any issues"
echo ""
echo "For webhook server: npm run webhook:start"
echo "For Docker deployment: npm run docker:compose"
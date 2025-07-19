#!/bin/bash

# Production Startup Script
# 本番環境起動スクリプト

echo "🚀 Claude Automation - Production Startup"
echo "========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as production
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please run setup first: ./scripts/verify-production.sh"
    exit 1
fi

# Source environment variables
source .env

echo -e "${BLUE}📋 Starting pre-flight checks...${NC}"

# Check critical environment variables
if [[ "$GITHUB_TOKEN" == *"placeholder"* ]]; then
    echo -e "${RED}❌ GitHub Token not configured${NC}"
    exit 1
fi

if [[ "$CLAUDE_API_KEY" == *"placeholder"* ]]; then
    echo -e "${RED}❌ Claude API Key not configured${NC}"
    exit 1
fi

if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}⚠️  NODE_ENV is not set to production${NC}"
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✅ Logs directory ready${NC}"

# Check system health before starting
echo -e "${BLUE}🔍 Running health check...${NC}"
npm run automation:health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ System health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check warnings detected${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Select startup mode:${NC}"
echo "1) Main System (Full automation)"
echo "2) Webhook Server (GitHub events only)"
echo "3) Interactive Mode (CLI)"
echo "4) Docker Compose"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting Main System...${NC}"
        echo "Press Ctrl+C to stop"
        npm start
        ;;
    2)
        echo -e "${GREEN}🔗 Starting Webhook Server...${NC}"
        echo "Server will run on port ${PORT:-3000}"
        echo "Press Ctrl+C to stop"
        npm run webhook:start
        ;;
    3)
        echo -e "${GREEN}💬 Starting Interactive Mode...${NC}"
        npm run automation:interactive
        ;;
    4)
        echo -e "${GREEN}🐳 Starting with Docker Compose...${NC}"
        if [ -f "docker/docker-compose.yml" ]; then
            npm run docker:compose
        else
            echo -e "${RED}❌ Docker Compose file not found${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📊 System Information:${NC}"
echo "- Environment: $NODE_ENV"
echo "- Port: ${PORT:-3000}"
echo "- Log Level: ${LOG_LEVEL:-info}"
echo "- Repository: $GITHUB_OWNER/$GITHUB_REPO"
echo ""
echo -e "${GREEN}✅ Claude Automation is now running!${NC}"
echo ""
echo "Useful commands:"
echo "- Monitor health: npm run automation:health"
echo "- View stats: npm run automation:stats"
echo "- Check logs: tail -f logs/automation.log"
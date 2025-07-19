#!/bin/bash

# System Monitoring Script
# システム監視スクリプト

echo "📊 Claude Automation - System Monitor"
echo "====================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display header
show_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "$(printf '%.0s-' {1..40})"
}

# Function to check if process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo -e "${GREEN}✅ $2 is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $2 is not running${NC}"
        return 1
    fi
}

# Real-time monitoring function
real_time_monitor() {
    while true; do
        clear
        echo "📊 Claude Automation - Real-time Monitor"
        echo "========================================"
        echo "$(date)"
        echo ""
        
        # System Status
        show_header "🔍 System Status"
        npm run automation:health 2>/dev/null | grep -E "(✅|❌|⚠️)"
        
        # Process Status
        show_header "🔧 Process Status"
        check_process "src/index.js" "Main System"
        check_process "src/webhook-server.js" "Webhook Server"
        check_process "ngrok" "ngrok Tunnel"
        
        # Resource Usage
        show_header "💾 Resource Usage"
        echo "Memory: $(ps aux | grep -E '(node|claude)' | grep -v grep | awk '{sum += $6} END {print sum/1024 " MB"}')"
        echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
        
        # Recent Logs
        show_header "📝 Recent Activity"
        if [ -f "logs/automation.log" ]; then
            tail -5 logs/automation.log | while read line; do
                echo "  $line"
            done
        else
            echo "  No log file found"
        fi
        
        # Statistics
        show_header "📈 Statistics"
        npm run automation:stats 2>/dev/null | grep -E "(PRs|Issues|Errors|Uptime)" | head -4
        
        echo ""
        echo -e "${YELLOW}Press Ctrl+C to exit monitoring${NC}"
        sleep 10
    done
}

# Check command line arguments
case "${1:-menu}" in
    "realtime"|"rt")
        real_time_monitor
        ;;
    "health"|"h")
        show_header "🔍 Health Check"
        npm run automation:health
        ;;
    "stats"|"s")
        show_header "📈 Statistics"
        npm run automation:stats
        ;;
    "logs"|"l")
        show_header "📝 Recent Logs"
        if [ -f "logs/automation.log" ]; then
            tail -20 logs/automation.log
        else
            echo "No log file found"
        fi
        ;;
    "errors"|"e")
        show_header "🚨 Error Logs"
        if [ -f "logs/error.log" ]; then
            tail -10 logs/error.log
        else
            echo "No error log file found"
        fi
        ;;
    "processes"|"p")
        show_header "🔧 Running Processes"
        ps aux | grep -E '(node|claude|ngrok)' | grep -v grep
        ;;
    "menu"|*)
        echo ""
        echo -e "${BLUE}📊 Monitoring Options:${NC}"
        echo ""
        echo "  ./scripts/monitor-system.sh realtime    - Real-time dashboard"
        echo "  ./scripts/monitor-system.sh health      - System health check"
        echo "  ./scripts/monitor-system.sh stats       - View statistics"
        echo "  ./scripts/monitor-system.sh logs        - Recent logs"
        echo "  ./scripts/monitor-system.sh errors      - Error logs"
        echo "  ./scripts/monitor-system.sh processes   - Running processes"
        echo ""
        echo -e "${BLUE}Quick Commands:${NC}"
        echo "  npm run automation:health    - Health check"
        echo "  npm run automation:stats     - Statistics"
        echo "  tail -f logs/automation.log  - Follow logs"
        echo ""
        
        # Quick status
        show_header "🔍 Quick Status"
        npm run automation:health 2>/dev/null | head -10
        ;;
esac
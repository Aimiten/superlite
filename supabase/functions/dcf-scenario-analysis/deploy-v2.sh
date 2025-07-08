#!/bin/bash

# DCF Scenario Analysis V2 Deployment Script
# Production-ready deployment with safety checks and rollback

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_NAME="dcf-scenario-analysis"
PROJECT_REF=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $3}' | cut -d'.' -f1 | sed 's/https:\/\///')
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./deployment_$(date +%Y%m%d_%H%M%S).log"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=10

# Function to log messages
log() {
    echo -e "${2:-}$1${NC}" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..." "$BLUE"
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log "❌ Supabase CLI not found. Please install it first." "$RED"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "index.ts" ]]; then
        log "❌ index.ts not found. Please run from the function directory." "$RED"
        exit 1
    fi
    
    # Check if logged in to Supabase
    if ! supabase status &> /dev/null; then
        log "❌ Not logged in to Supabase. Run 'supabase login' first." "$RED"
        exit 1
    fi
    
    # Check TypeScript compilation
    log "📦 Checking TypeScript compilation..." "$BLUE"
    if ! deno check index.ts 2>&1 | tee -a "$LOG_FILE"; then
        log "❌ TypeScript compilation failed. Fix errors before deploying." "$RED"
        exit 1
    fi
    
    log "✅ All prerequisites passed!" "$GREEN"
}

# Function to create backup
create_backup() {
    log "💾 Creating backup..." "$BLUE"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current function code
    cp -r ./* "$BACKUP_DIR/" 2>/dev/null || true
    
    # Save current function version info
    echo "Backup created at: $(date)" > "$BACKUP_DIR/backup_info.txt"
    echo "Function: $FUNCTION_NAME" >> "$BACKUP_DIR/backup_info.txt"
    echo "Project: $PROJECT_REF" >> "$BACKUP_DIR/backup_info.txt"
    
    # Get current function metadata if deployed
    if supabase functions list 2>/dev/null | grep -q "$FUNCTION_NAME"; then
        supabase functions list | grep "$FUNCTION_NAME" >> "$BACKUP_DIR/backup_info.txt"
    fi
    
    log "✅ Backup created at: $BACKUP_DIR" "$GREEN"
}

# Function to run pre-deployment tests
run_pre_deployment_tests() {
    log "🧪 Running pre-deployment tests..." "$BLUE"
    
    # Test 1: Check for hardcoded secrets
    if grep -r "sk-" . --include="*.ts" --include="*.js" 2>/dev/null | grep -v "Deno.env.get"; then
        log "⚠️  Warning: Potential hardcoded API keys found" "$YELLOW"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Test 2: Check for console.log statements
    if grep -r "console\.log" . --include="*.ts" 2>/dev/null; then
        log "⚠️  Warning: console.log statements found (consider using proper logging)" "$YELLOW"
    fi
    
    # Test 3: Validate required files
    required_files=("index.ts")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log "❌ Required file missing: $file" "$RED"
            exit 1
        fi
    done
    
    log "✅ Pre-deployment tests passed!" "$GREEN"
}

# Function to deploy
deploy_function() {
    log "🚀 Deploying function '$FUNCTION_NAME'..." "$BLUE"
    
    # Deploy with verification
    if supabase functions deploy "$FUNCTION_NAME" --verify-jwt 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ Function deployed successfully!" "$GREEN"
    else
        log "❌ Deployment failed!" "$RED"
        exit 1
    fi
}

# Function to health check
health_check() {
    log "🏥 Running health checks..." "$BLUE"
    
    # Get function URL
    FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
    
    # Wait for function to be ready
    log "⏳ Waiting for function to be ready..." "$YELLOW"
    sleep 5
    
    # Test with a simple request
    local retry=0
    while [ $retry -lt $HEALTH_CHECK_RETRIES ]; do
        log "🔍 Health check attempt $((retry + 1))/$HEALTH_CHECK_RETRIES..." "$BLUE"
        
        # Create a test payload
        local test_payload='{
            "revenue": 1000000,
            "expenses": 700000,
            "growthRate": 0.1,
            "discountRate": 0.12,
            "projectionYears": 5,
            "scenarios": {
                "conservative": {"revenueMultiplier": 0.8, "expenseMultiplier": 1.1},
                "base": {"revenueMultiplier": 1.0, "expenseMultiplier": 1.0},
                "optimistic": {"revenueMultiplier": 1.2, "expenseMultiplier": 0.95}
            }
        }'
        
        # Make test request
        response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            -d "$test_payload" 2>/dev/null || echo "000")
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [[ "$http_code" == "200" ]]; then
            log "✅ Health check passed! (HTTP $http_code)" "$GREEN"
            echo "Response: $body" >> "$LOG_FILE"
            return 0
        elif [[ "$http_code" == "401" ]]; then
            log "⚠️  Health check returned 401 - API key might be required" "$YELLOW"
            return 0  # This is expected if auth is required
        else
            log "❌ Health check failed (HTTP $http_code)" "$RED"
            echo "Response: $body" >> "$LOG_FILE"
        fi
        
        retry=$((retry + 1))
        if [ $retry -lt $HEALTH_CHECK_RETRIES ]; then
            log "⏳ Retrying in $HEALTH_CHECK_DELAY seconds..." "$YELLOW"
            sleep $HEALTH_CHECK_DELAY
        fi
    done
    
    log "❌ Health checks failed after $HEALTH_CHECK_RETRIES attempts" "$RED"
    return 1
}

# Function to monitor logs
monitor_logs() {
    log "📊 Monitoring function logs..." "$BLUE"
    log "Press Ctrl+C to stop monitoring" "$YELLOW"
    
    # Show last 20 lines and follow
    supabase functions logs "$FUNCTION_NAME" --tail 20 --follow
}

# Function to rollback
rollback() {
    log "🔄 Rolling back deployment..." "$YELLOW"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "❌ No backup found at $BACKUP_DIR" "$RED"
        exit 1
    fi
    
    # Copy files back
    cp -r "$BACKUP_DIR"/* . 2>/dev/null || true
    
    # Redeploy
    log "🚀 Redeploying previous version..." "$BLUE"
    if supabase functions deploy "$FUNCTION_NAME" --verify-jwt; then
        log "✅ Rollback completed successfully!" "$GREEN"
    else
        log "❌ Rollback failed!" "$RED"
        exit 1
    fi
}

# Main deployment flow
main() {
    log "🚀 DCF Scenario Analysis V2 Deployment Script" "$BLUE"
    log "================================================" "$BLUE"
    log "Project: $PROJECT_REF" "$YELLOW"
    log "Function: $FUNCTION_NAME" "$YELLOW"
    log "Timestamp: $(date)" "$YELLOW"
    log "================================================" "$BLUE"
    
    # Check if SUPABASE_ANON_KEY is set
    if [[ -z "${SUPABASE_ANON_KEY:-}" ]]; then
        log "⚠️  SUPABASE_ANON_KEY not set. Health checks will be limited." "$YELLOW"
        log "Set it with: export SUPABASE_ANON_KEY='your-anon-key'" "$YELLOW"
    fi
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Create backup
    create_backup
    
    # Step 3: Pre-deployment tests
    run_pre_deployment_tests
    
    # Step 4: Deploy
    deploy_function
    
    # Step 5: Health check
    if ! health_check; then
        log "❌ Health checks failed! Starting rollback..." "$RED"
        rollback
        exit 1
    fi
    
    log "✅ Deployment completed successfully!" "$GREEN"
    log "================================================" "$BLUE"
    
    # Ask if user wants to monitor logs
    read -p "Monitor function logs? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        monitor_logs
    fi
}

# Parse command line arguments
case "${1:-}" in
    "rollback")
        if [[ -z "${2:-}" ]]; then
            log "❌ Please specify backup directory for rollback" "$RED"
            log "Usage: $0 rollback ./backups/YYYYMMDD_HHMMSS" "$YELLOW"
            exit 1
        fi
        BACKUP_DIR="$2"
        rollback
        ;;
    "logs")
        monitor_logs
        ;;
    "help"|"-h"|"--help")
        echo "DCF Scenario Analysis V2 Deployment Script"
        echo ""
        echo "Usage:"
        echo "  $0              - Deploy the function with safety checks"
        echo "  $0 rollback DIR - Rollback to a specific backup"
        echo "  $0 logs         - Monitor function logs"
        echo "  $0 help         - Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  SUPABASE_ANON_KEY - Required for health checks"
        echo ""
        echo "Examples:"
        echo "  $0"
        echo "  $0 rollback ./backups/20240625_143022"
        echo "  SUPABASE_ANON_KEY='your-key' $0"
        ;;
    *)
        main
        ;;
esac
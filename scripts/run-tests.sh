#!/bin/bash
set -euo pipefail

# Next.js Test Runner for riscv64
# Automates testing of Next.js applications on Banana Pi F3

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DIR_REL="${1:-tests/pages-router}"
TEST_DIR="${PROJECT_ROOT}/${TEST_DIR_REL}"
OUTPUT_DIR="${PROJECT_ROOT}/docs/testing"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${OUTPUT_DIR}/test-report-${TIMESTAMP}.md"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" >&2
}

# Initialize report
init_report() {
    mkdir -p "$OUTPUT_DIR"

    cat > "$REPORT_FILE" <<EOF
# Next.js Test Report - riscv64

**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Test Application**: $TEST_DIR
**Architecture**: $(uname -m)
**OS**: $(uname -s) $(uname -r)
**Node.js**: $(node --version 2>/dev/null || echo "Not installed")
**npm**: $(npm --version 2>/dev/null || echo "Not installed")

## System Information

\`\`\`
$(uname -a)
\`\`\`

## Test Results

EOF
}

# Add section to report
add_to_report() {
    echo "$1" >> "$REPORT_FILE"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found. Please run scripts/install-nodejs.sh first"
        exit 1
    fi

    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm not found"
        exit 1
    fi

    log_info "Node.js $(node --version) found"
    log_info "npm $(npm --version) found"
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."

    cd "$TEST_DIR"

    local start_time=$(date +%s)

    if npm install; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_info "Dependencies installed in ${duration}s"

        add_to_report "### Dependency Installation"
        add_to_report ""
        add_to_report "✅ **Status**: Success"
        add_to_report "⏱️ **Duration**: ${duration}s"
        add_to_report ""
    else
        log_error "Dependency installation failed"

        add_to_report "### Dependency Installation"
        add_to_report ""
        add_to_report "❌ **Status**: Failed"
        add_to_report ""

        exit 1
    fi

    cd - > /dev/null
}

# Test development mode
test_dev_mode() {
    log_step "Testing development mode..."

    cd "$TEST_DIR"

    add_to_report "### Development Mode Test"
    add_to_report ""

    log_info "Starting dev server (will run for 30 seconds)..."

    # Start dev server in background
    if npm run dev > /tmp/nextjs-dev-test.log 2>&1 &
    then
        local dev_pid=$!
        log_info "Dev server started (PID: $dev_pid)"

        # Wait for server to start
        sleep 10

        # Check if process is still running
        if ps -p $dev_pid > /dev/null; then
            log_info "✅ Dev server is running"

            add_to_report "✅ **Status**: Success - Server started"
            add_to_report ""

            # Try to fetch the home page
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
                log_info "✅ Home page is accessible"
                add_to_report "✅ **Home Page**: Accessible (HTTP 200)"
            else
                log_warn "⚠️ Home page not accessible"
                add_to_report "⚠️ **Home Page**: Not accessible"
            fi

            # Stop dev server
            kill $dev_pid
            wait $dev_pid 2>/dev/null || true
            log_info "Dev server stopped"
        else
            log_error "❌ Dev server failed to start"
            add_to_report "❌ **Status**: Failed - Server did not start"
            cat /tmp/nextjs-dev-test.log
        fi
    else
        log_error "Failed to start dev server"
        add_to_report "❌ **Status**: Failed - Could not start server"
    fi

    add_to_report ""

    cd - > /dev/null
}

# Test production build
test_build() {
    log_step "Testing production build..."

    cd "$TEST_DIR"

    add_to_report "### Production Build Test"
    add_to_report ""

    local start_time=$(date +%s)

    if npm run build 2>&1 | tee /tmp/nextjs-build-test.log; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_info "✅ Build completed in ${duration}s"

        add_to_report "✅ **Status**: Success"
        add_to_report "⏱️ **Build Duration**: ${duration}s"

        # Get build output size
        if [ -d ".next" ]; then
            local build_size=$(du -sh .next | cut -f1)
            log_info "Build output size: ${build_size}"
            add_to_report "📦 **Build Size**: ${build_size}"
        fi

        add_to_report ""
    else
        log_error "❌ Build failed"

        add_to_report "❌ **Status**: Failed"
        add_to_report ""
        add_to_report "<details>"
        add_to_report "<summary>Build Log</summary>"
        add_to_report ""
        add_to_report "\`\`\`"
        add_to_report "$(cat /tmp/nextjs-build-test.log)"
        add_to_report "\`\`\`"
        add_to_report ""
        add_to_report "</details>"
        add_to_report ""

        cd - > /dev/null
        exit 1
    fi

    cd - > /dev/null
}

# Test production server
test_production_server() {
    log_step "Testing production server..."

    cd "$TEST_DIR"

    add_to_report "### Production Server Test"
    add_to_report ""

    log_info "Starting production server (will run for 30 seconds)..."

    # Start production server in background
    if npm run start > /tmp/nextjs-prod-test.log 2>&1 &
    then
        local prod_pid=$!
        log_info "Production server started (PID: $prod_pid)"

        # Wait for server to start
        sleep 5

        # Check if process is still running
        if ps -p $prod_pid > /dev/null; then
            log_info "✅ Production server is running"

            add_to_report "✅ **Status**: Success - Server started"
            add_to_report ""

            # Test various endpoints
            local endpoints=("/" "/about" "/ssg" "/ssr" "/api/test")

            for endpoint in "${endpoints[@]}"; do
                local http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${endpoint}")

                if [ "$http_code" = "200" ]; then
                    log_info "✅ ${endpoint}: HTTP ${http_code}"
                    add_to_report "- ✅ \`${endpoint}\`: HTTP ${http_code}"
                else
                    log_warn "⚠️ ${endpoint}: HTTP ${http_code}"
                    add_to_report "- ⚠️ \`${endpoint}\`: HTTP ${http_code}"
                fi
            done

            # Stop production server
            kill $prod_pid
            wait $prod_pid 2>/dev/null || true
            log_info "Production server stopped"
        else
            log_error "❌ Production server failed to start"
            add_to_report "❌ **Status**: Failed - Server did not start"
            cat /tmp/nextjs-prod-test.log
        fi
    else
        log_error "Failed to start production server"
        add_to_report "❌ **Status**: Failed - Could not start server"
    fi

    add_to_report ""

    cd - > /dev/null
}

# Finalize report
finalize_report() {
    add_to_report "## Summary"
    add_to_report ""
    add_to_report "Test completed at $(date '+%Y-%m-%d %H:%M:%S')"
    add_to_report ""
    add_to_report "Report saved to: \`${REPORT_FILE}\`"

    log_info "Test report saved to: ${REPORT_FILE}"
}

# Main
main() {
    log_info "Next.js Test Runner for riscv64"
    log_info "=============================="
    log_info "Test Directory: ${TEST_DIR}"
    log_info ""

    check_prerequisites
    init_report
    install_dependencies
    test_dev_mode
    test_build
    test_production_server
    finalize_report

    log_info ""
    log_info "✅ All tests completed!"
    log_info "View report: ${REPORT_FILE}"
}

main "$@"

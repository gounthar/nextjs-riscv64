#!/bin/bash
set -euo pipefail

# Build @next/swc Native Binary for riscv64
# This script builds the Next.js SWC compiler from source on riscv64 hardware
#
# Usage: ./build-native-swc.sh [version] [output-dir]
# Example: ./build-native-swc.sh v13.5.6 ./builds

# Configuration
DEFAULT_VERSION="v13.5.6"
NEXT_VERSION="${1:-$DEFAULT_VERSION}"
OUTPUT_DIR="${2:-./builds/${NEXT_VERSION}}"
BUILD_DIR=$(mktemp -d "/tmp/nextjs-swc-build.XXXXXXXXXX")
LOG_FILE="${BUILD_DIR}/build.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "${LOG_FILE:-/dev/null}" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "${LOG_FILE:-/dev/null}" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE:-/dev/null}" >&2
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" | tee -a "${LOG_FILE:-/dev/null}" >&2
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing_deps=()

    # Check for required commands
    command -v git >/dev/null 2>&1 || missing_deps+=(git)
    command -v cargo >/dev/null 2>&1 || missing_deps+=(cargo)
    command -v rustc >/dev/null 2>&1 || missing_deps+=(rustc)
    command -v gcc >/dev/null 2>&1 || missing_deps+=(build-essential)

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        log_info "Install system dependencies:"
        echo "  sudo apt-get install -y build-essential gcc g++ git pkg-config libssl-dev"
        echo ""
        log_info "Install Rust:"
        echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        echo "  source \"\$HOME/.cargo/env\""
        exit 1
    fi

    # Check Rust version
    local rust_version=$(rustc --version | awk '{print $2}')
    log_info "Rust version: ${rust_version}"

    # Check if nightly toolchain is available
    if ! rustup toolchain list | grep -q "nightly-2023-10-06"; then
        log_warn "Nightly toolchain not found. Installing nightly-2023-10-06..."
        rustup toolchain install nightly-2023-10-06-riscv64gc-unknown-linux-gnu || {
            log_error "Failed to install nightly toolchain"
            exit 1
        }
    fi

    log_info "All prerequisites satisfied"
}

# Check architecture
check_architecture() {
    local arch=$(uname -m)
    if [ "$arch" != "riscv64" ]; then
        log_warn "This script is designed for riscv64 architecture, but detected: $arch"
        log_warn "Cross-compilation support is experimental"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Estimate build time
estimate_build_time() {
    local cores=$(nproc)
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')

    log_info "System: ${cores} cores, ${mem_gb}GB RAM"

    if [ "$cores" -ge 8 ] && [ "$mem_gb" -ge 8 ]; then
        log_info "Estimated build time: 2-3 hours"
    elif [ "$cores" -ge 4 ]; then
        log_info "Estimated build time: 3-5 hours"
    else
        log_info "Estimated build time: 5+ hours"
    fi
}

# Setup build directory
setup_build_dir() {
    log_step "Setting up build directory..."

    mkdir -p "${BUILD_DIR}"
    mkdir -p "${OUTPUT_DIR}"

    # Initialize log file
    touch "${LOG_FILE}"

    log_info "Build directory: ${BUILD_DIR}"
    log_info "Output directory: ${OUTPUT_DIR}"
    log_info "Log file: ${LOG_FILE}"
}

# Clone Next.js repository
clone_nextjs() {
    log_step "Cloning Next.js repository..."

    if [ -d "${BUILD_DIR}/next.js" ]; then
        log_info "Repository already exists, updating..."
        cd "${BUILD_DIR}/next.js"
        git fetch --all
    else
        git clone --depth 100 https://github.com/vercel/next.js.git "${BUILD_DIR}/next.js"
        cd "${BUILD_DIR}/next.js"
    fi

    # Checkout target version
    log_info "Checking out ${NEXT_VERSION}..."
    git checkout "${NEXT_VERSION}" || {
        log_error "Failed to checkout ${NEXT_VERSION}"
        log_info "Available versions:"
        git tag | grep "^v13\|^v14\|^v15" | tail -20
        exit 1
    }

    log_info "Checked out: $(git describe --tags)"
}

# Build SWC binary
build_swc() {
    log_step "Building @next/swc native binary..."

    cd "${BUILD_DIR}/next.js/packages/next-swc"

    # Source Rust environment
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi

    log_info "Starting cargo build (this will take 2-4 hours)..."
    log_info "Build flags: --release --no-default-features (to avoid ring dependency)"
    echo ""

    # Build with cargo directly, without default features to avoid ring v0.16.20
    # The --no-default-features flag skips TLS dependencies that require ring
    local start_time=$(date +%s)

    cargo build --release \
        --manifest-path crates/napi/Cargo.toml \
        --no-default-features \
        2>&1 | tee -a "${LOG_FILE}"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))

    log_info "Build completed in ${hours}h ${minutes}m"
}

# Find and package binary
package_binary() {
    log_step "Packaging binary..."

    # Find the built binary
    local binary_path

    # Try common locations
    for path in \
        "${BUILD_DIR}/next.js/target/release/libnext_swc_napi.so" \
        "${BUILD_DIR}/next.js/packages/next-swc/target/release/libnext_swc_napi.so" \
        "${BUILD_DIR}/next.js/packages/next-swc/native/next-swc.linux-riscv64gc-gnu.node"
    do
        if [ -f "$path" ]; then
            binary_path="$path"
            break
        fi
    done

    if [ -z "$binary_path" ]; then
        log_error "Could not find built binary"
        log_info "Searching for .so and .node files..."
        find "${BUILD_DIR}/next.js" -name "*.so" -o -name "*.node" | head -20
        exit 1
    fi

    log_info "Found binary: ${binary_path}"

    # Copy and rename binary
    local output_name="next-swc.linux-riscv64gc-gnu.node"
    cp "${binary_path}" "${OUTPUT_DIR}/${output_name}"

    # Generate checksum
    cd "${OUTPUT_DIR}"
    sha256sum "${output_name}" > SHA256SUMS

    # Create package.json for npm compatibility
    cat > package.json <<EOF
{
  "name": "@next/swc-linux-riscv64gc-gnu",
  "version": "${NEXT_VERSION#v}",
  "description": "Next.js SWC native binary for Linux riscv64",
  "main": "${output_name}",
  "files": [
    "${output_name}"
  ],
  "os": ["linux"],
  "cpu": ["riscv64"],
  "engines": {
    "node": ">= 10"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/gounthar/nextjs-riscv64"
  },
  "license": "MIT"
}
EOF

    # Create build info
    cat > BUILD-INFO.md <<EOF
## Build Information

- **Package**: @next/swc
- **Version**: ${NEXT_VERSION}
- **Platform**: linux-riscv64gc-gnu
- **Build Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- **Hardware**: $(uname -m) $(cat /proc/cpuinfo | grep "model name\|Hardware" | head -1 | cut -d: -f2 | xargs)
- **OS**: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
- **Rust Version**: $(rustc --version | awk '{print $2}')
- **Build Flags**: --release --no-default-features
- **SHA256**: $(sha256sum "${output_name}" | awk '{print $1}')

## Installation

\`\`\`bash
mkdir -p node_modules/@next/swc-linux-riscv64gc-gnu
cp ${output_name} node_modules/@next/swc-linux-riscv64gc-gnu/
cp package.json node_modules/@next/swc-linux-riscv64gc-gnu/
\`\`\`

## Notes

Built without default features to avoid ring v0.16.20 dependency issue on riscv64.
TLS features are disabled but not required for local compilation.
EOF

    log_info "Binary packaged successfully"
    log_info "Output: ${OUTPUT_DIR}/${output_name}"
    log_info "Size: $(du -h "${OUTPUT_DIR}/${output_name}" | cut -f1)"
}

# Cleanup
cleanup() {
    log_step "Cleaning up..."

    if [ -d "${BUILD_DIR}" ]; then
        local keep_logs="${KEEP_BUILD_LOGS:-false}"

        if [ "$keep_logs" = "true" ]; then
            log_info "Keeping build logs at: ${LOG_FILE}"
        else
            log_info "Removing build directory: ${BUILD_DIR}"
            rm -rf "${BUILD_DIR}"
        fi
    fi
}

# Print summary
print_summary() {
    echo ""
    log_info "======================================"
    log_info "Build Complete!"
    log_info "======================================"
    echo ""
    log_info "Output files in ${OUTPUT_DIR}:"
    ls -lh "${OUTPUT_DIR}"
    echo ""
    log_info "To install in a Next.js project:"
    echo ""
    echo "  mkdir -p node_modules/@next/swc-linux-riscv64gc-gnu"
    echo "  cp ${OUTPUT_DIR}/next-swc.linux-riscv64gc-gnu.node \\"
    echo "     node_modules/@next/swc-linux-riscv64gc-gnu/"
    echo "  cp ${OUTPUT_DIR}/package.json \\"
    echo "     node_modules/@next/swc-linux-riscv64gc-gnu/"
    echo ""
    log_info "Don't forget to apply the Next.js loader patch!"
    log_info "See: patches/apply-nextjs-patch.sh"
}

# Main
main() {
    log_info "======================================="
    log_info "@next/swc Build Script for riscv64"
    log_info "======================================="
    log_info "Version: ${NEXT_VERSION}"
    echo ""

    check_architecture
    estimate_build_time
    check_prerequisites
    setup_build_dir
    clone_nextjs
    build_swc
    package_binary
    cleanup
    print_summary
}

# Handle interrupts
trap 'log_error "Build interrupted"; cleanup; exit 1' INT TERM

main "$@"

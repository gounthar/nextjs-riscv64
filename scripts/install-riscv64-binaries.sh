#!/bin/bash
set -euo pipefail

# Install Prebuilt riscv64 Binaries for Next.js
# Downloads and installs @next/swc and other native binaries from GitHub releases
#
# Usage: ./install-riscv64-binaries.sh [version] [project-dir]
# Example: ./install-riscv64-binaries.sh v13.5.6 /path/to/nextjs-project

# Configuration
DEFAULT_VERSION="v13.5.6"
NEXT_VERSION="${1:-$DEFAULT_VERSION}"
PROJECT_DIR="${2:-.}"
GITHUB_REPO="gounthar/nextjs-riscv64"
RELEASES_URL="https://github.com/${GITHUB_REPO}/releases/download"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" >&2
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing_deps=()

    command -v curl >/dev/null 2>&1 || missing_deps+=(curl)
    command -v sha256sum >/dev/null 2>&1 || missing_deps+=(coreutils)
    command -v patch >/dev/null 2>&1 || missing_deps+=(patch)

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Install them with: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi

    log_info "All prerequisites satisfied"
}

# Check architecture
check_architecture() {
    local arch=$(uname -m)
    if [ "$arch" != "riscv64" ]; then
        log_error "This script is for riscv64 architecture only"
        log_error "Detected: $arch"
        exit 1
    fi
}

# Validate project directory
validate_project() {
    log_step "Validating Next.js project..."

    if [ ! -d "${PROJECT_DIR}" ]; then
        log_error "Project directory not found: ${PROJECT_DIR}"
        exit 1
    fi

    cd "${PROJECT_DIR}"

    if [ ! -f "package.json" ]; then
        log_error "package.json not found in ${PROJECT_DIR}"
        log_error "Please run this script from a Next.js project directory"
        exit 1
    fi

    # Check if Next.js is installed
    if [ ! -d "node_modules/next" ]; then
        log_error "Next.js not found in node_modules"
        log_error "Please run 'npm install' first"
        exit 1
    fi

    # Get installed Next.js version
    local installed_version=$(node -e "console.log(require('./node_modules/next/package.json').version)")
    log_info "Installed Next.js version: ${installed_version}"

    # Warn if version mismatch
    if [ "v${installed_version}" != "${NEXT_VERSION}" ]; then
        log_warn "Version mismatch: installing ${NEXT_VERSION} binaries for Next.js ${installed_version}"
        log_warn "This may cause compatibility issues"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Download binary from GitHub releases
download_binary() {
    log_step "Downloading prebuilt binary..."

    local release_tag="${NEXT_VERSION}-riscv64-1"
    local binary_name="next-swc.linux-riscv64gc-gnu.node"
    local download_url="${RELEASES_URL}/${release_tag}/${binary_name}"
    local checksum_url="${RELEASES_URL}/${release_tag}/SHA256SUMS"

    local tmp_dir=$(mktemp -d)

    log_info "Downloading from: ${download_url}"

    # Download binary
    if ! curl -fsSL -o "${tmp_dir}/${binary_name}" "${download_url}"; then
        log_error "Failed to download binary"
        log_info "Release URL: https://github.com/${GITHUB_REPO}/releases/tag/${release_tag}"
        log_info ""
        log_info "Available releases:"
        curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases" | \
            grep '"tag_name"' | head -10 | cut -d'"' -f4 || true
        rm -rf "${tmp_dir}"
        exit 1
    fi

    # Download checksum
    if curl -fsSL -o "${tmp_dir}/SHA256SUMS" "${checksum_url}" 2>/dev/null; then
        log_info "Verifying checksum..."
        cd "${tmp_dir}"
        if ! sha256sum -c SHA256SUMS; then
            log_error "Checksum verification failed!"
            rm -rf "${tmp_dir}"
            exit 1
        fi
        log_info "Checksum verified"
    else
        log_warn "Could not download checksum file, skipping verification"
    fi

    echo "${tmp_dir}/${binary_name}"
}

# Install binary to project
install_binary() {
    local binary_path="$1"
    local binary_name=$(basename "${binary_path}")

    log_step "Installing binary..."

    cd "${PROJECT_DIR}"

    # Create package directory
    local pkg_dir="node_modules/@next/swc-linux-riscv64gc-gnu"
    mkdir -p "${pkg_dir}"

    # Copy binary
    cp "${binary_path}" "${pkg_dir}/${binary_name}"

    # Create package.json
    cat > "${pkg_dir}/package.json" <<EOF
{
  "name": "@next/swc-linux-riscv64gc-gnu",
  "version": "${NEXT_VERSION#v}",
  "main": "${binary_name}"
}
EOF

    log_info "Binary installed to: ${pkg_dir}"

    # Cleanup
    rm -rf "$(dirname "${binary_path}")"
}

# Apply Next.js loader patch
apply_patch() {
    log_step "Applying Next.js loader patch..."

    local loader_file="node_modules/next/dist/build/swc/index.js"

    if [ ! -f "${loader_file}" ]; then
        log_error "Next.js loader file not found: ${loader_file}"
        exit 1
    fi

    # Check if patch is already applied
    if grep -q "riscv64:" "${loader_file}"; then
        log_info "Patch already applied"
        return
    fi

    # Create backup
    cp "${loader_file}" "${loader_file}.backup"

    # Apply patch: add riscv64 to platform detection
    # This maps Node.js 'riscv64' arch to @napi-rs/triples 'riscv64gc' key
    sed -i 's/arm64: linux\.arm64,/arm64: linux.arm64,\n                    riscv64: linux.riscv64gc,/' "${loader_file}"

    # Verify patch was applied
    if grep -q "riscv64:" "${loader_file}"; then
        log_info "Patch applied successfully"
    else
        log_error "Failed to apply patch"
        log_info "Restoring backup..."
        mv "${loader_file}.backup" "${loader_file}"
        exit 1
    fi
}

# Test installation
test_installation() {
    log_step "Testing installation..."

    cd "${PROJECT_DIR}"

    # Try to load the binary
    if node -e "
        try {
            const binding = require('@next/swc-linux-riscv64gc-gnu');
            console.log('Binary loaded successfully');
            process.exit(0);
        } catch (e) {
            console.error('Failed to load binary:', e.message);
            process.exit(1);
        }
    "; then
        log_info "Binary loads correctly"
    else
        log_error "Binary failed to load"
        log_info "This may indicate a compatibility issue"
    fi
}

# Print summary
print_summary() {
    echo ""
    log_info "======================================"
    log_info "Installation Complete!"
    log_info "======================================"
    echo ""
    log_info "Installed components:"
    echo "  - @next/swc-linux-riscv64gc-gnu (native binary)"
    echo "  - Next.js loader patch (riscv64 support)"
    echo ""
    log_info "Next steps:"
    echo "  1. Run 'npm run build' to test production build"
    echo "  2. Run 'npm run dev' to test development server"
    echo ""
    log_info "If you update Next.js, run this script again to reinstall binaries"
}

# Main
main() {
    log_info "======================================="
    log_info "riscv64 Binaries Installer for Next.js"
    log_info "======================================="
    log_info "Version: ${NEXT_VERSION}"
    log_info "Project: ${PROJECT_DIR}"
    echo ""

    check_architecture
    check_prerequisites
    validate_project

    local binary_path=$(download_binary)
    install_binary "${binary_path}"
    apply_patch
    test_installation
    print_summary
}

main "$@"

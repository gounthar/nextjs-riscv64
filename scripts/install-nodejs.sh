#!/bin/bash
set -euo pipefail

# Node.js Installation Script for riscv64 (Banana Pi F3)
# Downloads and installs Node.js from gounthar/unofficial-builds releases

# Configuration
DEFAULT_VERSION="v24.11.1"
NODE_VERSION="${1:-$DEFAULT_VERSION}"
INSTALL_DIR="${HOME}/.local"
GITHUB_REPO="gounthar/unofficial-builds"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_deps=()

    command -v wget >/dev/null 2>&1 || missing_deps+=(wget)
    command -v tar >/dev/null 2>&1 || missing_deps+=(tar)
    command -v xz >/dev/null 2>&1 || missing_deps+=(xz-utils)

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Install them with: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi

    log_info "All prerequisites satisfied"
}

# Check if running on riscv64
check_architecture() {
    local arch=$(uname -m)
    if [ "$arch" != "riscv64" ]; then
        log_warn "This script is designed for riscv64 architecture, but detected: $arch"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Download Node.js binary
download_nodejs() {
    log_info "Downloading Node.js ${NODE_VERSION} for riscv64..."

    local filename="node-${NODE_VERSION}-linux-riscv64.tar.xz"
    local download_url="https://github.com/${GITHUB_REPO}/releases/download/${NODE_VERSION}/${filename}"
    local tmp_dir=$(mktemp -d)

    log_info "Download URL: ${download_url}"
    log_info "Temporary directory: ${tmp_dir}"

    if ! wget -q --show-progress -O "${tmp_dir}/${filename}" "${download_url}"; then
        log_error "Failed to download Node.js"
        rm -rf "${tmp_dir}"
        exit 1
    fi

    echo "${tmp_dir}/${filename}"
}

# Extract and install Node.js
install_nodejs() {
    local tarball="$1"
    local tmp_dir=$(dirname "$tarball")

    log_info "Extracting Node.js..."
    tar -xf "$tarball" -C "$tmp_dir"

    local extracted_dir="${tmp_dir}/node-${NODE_VERSION}-linux-riscv64"

    if [ ! -d "$extracted_dir" ]; then
        log_error "Extracted directory not found: $extracted_dir"
        rm -rf "$tmp_dir"
        exit 1
    fi

    log_info "Installing to ${INSTALL_DIR}..."
    mkdir -p "${INSTALL_DIR}"

    # Copy binaries
    cp -r "${extracted_dir}"/* "${INSTALL_DIR}/"

    rm -rf "$tmp_dir"

    log_info "Node.js installed successfully"
}

# Configure PATH
configure_path() {
    local shell_rc="${HOME}/.bashrc"

    if [ -f "${HOME}/.zshrc" ]; then
        shell_rc="${HOME}/.zshrc"
    fi

    log_info "Configuring PATH in ${shell_rc}..."

    if ! grep -q "${INSTALL_DIR}/bin" "${shell_rc}" 2>/dev/null; then
        echo "" >> "${shell_rc}"
        echo "# Node.js riscv64 from unofficial-builds" >> "${shell_rc}"
        echo "export PATH=\"${INSTALL_DIR}/bin:\$PATH\"" >> "${shell_rc}"
        log_info "Added ${INSTALL_DIR}/bin to PATH in ${shell_rc}"
    else
        log_info "PATH already configured"
    fi

    export PATH="${INSTALL_DIR}/bin:$PATH"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."

    if ! command -v node >/dev/null 2>&1; then
        log_error "node command not found in PATH"
        log_info "Try running: export PATH=\"${INSTALL_DIR}/bin:\$PATH\""
        exit 1
    fi

    local node_version=$(node --version)
    local npm_version=$(npm --version)

    log_info "Node.js version: ${node_version}"
    log_info "npm version: ${npm_version}"
    log_info "Node.js path: $(which node)"

    log_info "Installation verification complete!"
}

# Main
main() {
    log_info "Node.js riscv64 Installation Script"
    log_info "======================================"

    check_architecture
    check_prerequisites

    local tarball=$(download_nodejs)
    install_nodejs "$tarball"
    configure_path
    verify_installation

    echo ""
    log_info "Installation complete! 🎉"
    log_info "To use Node.js in current shell, run:"
    echo -e "  ${GREEN}export PATH=\"${INSTALL_DIR}/bin:\$PATH\"${NC}"
    log_info "Or start a new shell session."
}

main "$@"

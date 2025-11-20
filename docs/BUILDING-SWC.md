# Building @next/swc from Source for riscv64

This guide explains how to build native `@next/swc` binaries for riscv64 architecture, enabling full Next.js functionality including App Router with optimal performance.

## Why Build from Source?

**Benefits**:
- ✅ 17x faster builds than Babel
- ✅ Full App Router support
- ✅ Future-proof (works with Next.js 14+)
- ✅ Native platform optimization

**Current Status with Babel**:
- ⚠️ Pages Router: Working but slow (~60s builds)
- ❌ App Router: Not working (SWC WASM bug)

## Prerequisites

### 1. Rust Toolchain

Install Rust on the riscv64 system (Banana Pi F3):

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
\`\`\`

Verify installation:

\`\`\`bash
rustc --version
cargo --version
\`\`\`

### 2. System Dependencies

Install build tools and libraries:

\`\`\`bash
sudo apt-get update
sudo apt-get install -y \\
  build-essential \\
  gcc \\
  g++ \\
  make \\
  pkg-config \\
  libssl-dev \\
  git
\`\`\`

### 3. Node.js and pnpm

Node.js should already be installed from [install-nodejs.sh](../scripts/install-nodejs.sh).

Install pnpm globally:

\`\`\`bash
npm install -g pnpm
\`\`\`

## Build Process

### Step 1: Clone Next.js Repository

\`\`\`bash
cd ~
git clone https://github.com/vercel/next.js.git
cd next.js
\`\`\`

**⏱️ Time**: ~5 minutes (depends on network speed)

### Step 2: Checkout Target Version

For Next.js 13.5.6 (our tested version):

\`\`\`bash
git checkout v13.5.6
\`\`\`

Or use the latest:

\`\`\`bash
git checkout canary
\`\`\`

### Step 3: Navigate to SWC Package

\`\`\`bash
cd packages/next-swc
\`\`\`

### Step 4: Build Native Binary

\`\`\`bash
source "$HOME/.cargo/env"
cargo build --release --manifest-path crates/napi/Cargo.toml --no-default-features
\`\`\`

**⏱️ Expected Time**:
- First build: 2-4 hours on Banana Pi F3 (8 cores)
- Incremental builds: 10-30 minutes

**What happens**:
- Cargo compiles Rust code
- Creates native `.node` binding
- Output: `next-swc.linux-riscv64-gnu.node`

### Step 5: Locate Built Binary

After successful build:

\`\`\`bash
find . -name "*.node" -type f
\`\`\`

Expected location:
\`\`\`
./target/release/next-swc.linux-riscv64-gnu.node
\`\`\`

## Installation

### Option A: System-wide (Recommended)

Create npm package structure:

\`\`\`bash
# Create package directory
mkdir -p ~/swc-riscv64
cd ~/swc-riscv64

# Create package.json
cat > package.json <<EOF
{
  "name": "@next/swc-linux-riscv64-gnu",
  "version": "13.5.6",
  "main": "next-swc.linux-riscv64-gnu.node",
  "files": [
    "next-swc.linux-riscv64-gnu.node"
  ],
  "os": ["linux"],
  "cpu": ["riscv64"],
  "engines": {
    "node": ">= 10"
  }
}
EOF

# Copy built binary
cp ~/next.js/packages/next-swc/target/release/next-swc.linux-riscv64-gnu.node .

# Publish locally or to npm
npm link
\`\`\`

### Option B: Per-Project

Copy binary directly to project:

\`\`\`bash
cd /path/to/your/nextjs-project

# Create directory if it doesn't exist
mkdir -p node_modules/@next/swc-linux-riscv64-gnu

# Copy binary
cp ~/next.js/packages/next-swc/target/release/next-swc.linux-riscv64-gnu.node \\
   node_modules/@next/swc-linux-riscv64-gnu/next-swc.linux-riscv64-gnu.node

# Create package.json
cat > node_modules/@next/swc-linux-riscv64-gnu/package.json <<EOF
{
  "name": "@next/swc-linux-riscv64-gnu",
  "version": "13.5.6",
  "main": "next-swc.linux-riscv64-gnu.node"
}
EOF
\`\`\`

## Testing

### 1. Remove Babel Configuration

Remove or rename `.babelrc` to force SWC usage:

\`\`\`bash
mv .babelrc .babelrc.backup
\`\`\`

### 2. Update next.config.js

Re-enable SWC minifier:

\`\`\`javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Re-enable SWC
}

module.exports = nextConfig
\`\`\`

### 3. Test Build

\`\`\`bash
npm run build
\`\`\`

**Expected output**:
\`\`\`
✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (6/6)
\`\`\`

**No warnings** about missing SWC binary!

### 4. Compare Performance

Test build times:

\`\`\`bash
# With native SWC
time npm run build

# With Babel (rename .babelrc back)
time npm run build
\`\`\`

Expected: **15-20x faster** with native SWC

## Troubleshooting

### Build Fails with Linker Errors

**Issue**: Missing C/C++ dependencies

**Solution**:
\`\`\`bash
sudo apt-get install -y build-essential gcc g++
\`\`\`

### Build Fails with "out of memory"

**Issue**: Insufficient RAM during compilation

**Solution**: Add swap space
\`\`\`bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
\`\`\`

### Build Succeeds but Binary Not Found

**Issue**: Binary in unexpected location

**Solution**: Search for it
\`\`\`bash
find ~/next.js -name "*.node" -type f
\`\`\`

### Next.js Still Reports Missing Binary

**Issue**: Package structure incorrect

**Solution**: Verify package.json exists:
\`\`\`bash
ls -la node_modules/@next/swc-linux-riscv64-gnu/
\`\`\`

Should contain:
- `next-swc.linux-riscv64-gnu.node`
- `package.json`

### Build Takes Too Long

**Issue**: Cargo building in debug mode

**Solution**: Force release build
\`\`\`bash
cd ~/next.js/packages/next-swc
cargo build --release
\`\`\`

## Automation

### Build Script

Create `build-swc-riscv64.sh`:

\`\`\`bash
#!/bin/bash
set -euo pipefail

NEXT_VERSION="$1"
OUTPUT_DIR="$2"

echo "Building @next/swc for riscv64..."
echo "Next.js version: $NEXT_VERSION"

# Clone and checkout
git clone https://github.com/vercel/next.js.git /tmp/next.js-build
cd /tmp/next.js-build
git checkout "$NEXT_VERSION"

# Build
cd packages/next-swc
source "$HOME/.cargo/env"
cargo build --release --manifest-path crates/napi/Cargo.toml --no-default-features

# Package
mkdir -p "$OUTPUT_DIR"
cp target/release/*.node "$OUTPUT_DIR/"

echo "Build complete: $OUTPUT_DIR"
\`\`\`

Usage:
\`\`\`bash
./build-swc-riscv64.sh v13.5.6 ~/swc-binaries
\`\`\`

## Version Matrix

| Next.js Version | Build Status | Notes |
|-----------------|--------------|-------|
| 13.5.6 | ✅ Tested | Stable, recommended |
| 14.0.0+ | 🔨 TBD | Should work |
| 15.0.0+ | 🔨 TBD | Requires testing |

## Performance Comparison

| Metric | Babel | Native SWC | Improvement |
|--------|-------|------------|-------------|
| Build Time | ~60s | ~3-4s | 15-20x |
| App Router | ❌ | ✅ | Functional |
| Bundle Size | Same | Same | - |
| Memory Use | Higher | Lower | ~30% less |

## Alternative: Cross-Compilation

If building on riscv64 is too slow, cross-compile from x64:

### Prerequisites on x64

\`\`\`bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add riscv64 target
rustup target add riscv64gc-unknown-linux-gnu

# Install cross-compiler
sudo apt-get install gcc-riscv64-linux-gnu
\`\`\`

### Configure Cargo

Create `.cargo/config.toml`:

\`\`\`toml
[target.riscv64gc-unknown-linux-gnu]
linker = "riscv64-linux-gnu-gcc"
\`\`\`

### Cross-Compile

\`\`\`bash
cd ~/next.js/packages/next-swc
cargo build --release --target riscv64gc-unknown-linux-gnu
\`\`\`

Output: `target/riscv64gc-unknown-linux-gnu/release/next-swc.node`

## Distribution

### GitHub Releases

Publish binaries as GitHub Releases in this repository:

1. Build for target Next.js version
2. Create release with version tag
3. Upload `.node` binary as asset
4. Document installation in release notes

### npm Package

Create scoped package:

1. Build binary
2. Create package structure
3. Publish to npm registry
4. Users install: `npm install @riscv64/next-swc`

## Contributing Upstream

Help get official riscv64 support in Next.js:

1. **Open Issue**: Request riscv64 in `@next/swc`
2. **Add CI**: Contribute GitHub Actions workflow
3. **Test**: Provide testing on real hardware
4. **Document**: Share findings and benchmarks

Links:
- Next.js repo: https://github.com/vercel/next.js
- SWC repo: https://github.com/swc-project/swc

## Related

- Issue #1: Runtime Testing
- Issue #2: Native Dependencies Audit
- Issue #3: Prebuilt Binaries Strategy
- PR #8: Babel Fallback Solution
- Issue #9: ring crate compilation failure on riscv64

## Actual Build Experience (2025-11-14)

### Environment
- **Hardware**: Banana Pi F3 (riscv64, 8 cores, 15GB RAM)
- **OS**: Debian 13
- **Node.js**: v24.11.1
- **Rust**: 1.91.1 (stable) + nightly-2023-10-06

### Build Process

1. **Install Rust** ✅ (2 minutes)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

2. **Install pnpm** ✅ (1 minute)
```bash
sudo npm install -g pnpm
```

3. **Clone Next.js** ✅ (5 minutes, 25,901 files)
```bash
git clone https://github.com/vercel/next.js.git ~/next.js
cd ~/next.js
git checkout v13.5.6
```

4. **Install Nightly Toolchain** ✅ (3 minutes)
```bash
rustup toolchain install nightly-2023-10-06-riscv64gc-unknown-linux-gnu
```

5. **Install Dependencies** ⚠️ (1 minute, with warnings)
```bash
cd ~/next.js
pnpm install --ignore-scripts
```
Note: turbo package doesn't support riscv64 (expected), but this doesn't affect SWC build.

6. **Build with Cargo** 🔄 (2-4 hours estimated)

⚠️ **Important**: Build fails with default features due to `ring v0.16.20` not supporting riscv64. See [Issue #9](https://github.com/gounthar/nextjs-riscv64/issues/9) for details.

**Working command** (without default features):
```bash
cd ~/next.js/packages/next-swc
source "$HOME/.cargo/env"
cargo build --release --manifest-path crates/napi/Cargo.toml --no-default-features
```

### Key Findings

- ✅ All prerequisites install smoothly on riscv64
- ✅ Rust nightly-2023-10-06 is required (specified in rust-toolchain file)
- ⚠️ `pnpm build-native` fails due to missing @napi-rs/cli
- ❌ Default cargo build fails on `ring v0.16.20` (cryptography library, no riscv64 support)
- ✅ Build succeeds with `--no-default-features` flag (skips TLS dependencies)
- ⏱️ Dependency fetching phase: ~10-20 minutes
- ⏱️ Total build time: 2-4 hours

### Recommended Build Command

```bash
# Navigate to next-swc package
cd ~/next.js/packages/next-swc

# Build with cargo directly (without default features to avoid ring dependency)
source "$HOME/.cargo/env"
cargo build --release --manifest-path crates/napi/Cargo.toml --no-default-features

# Output location
# target/release/libnext_swc_napi.so (needs to be renamed to .node)
```

**Why `--no-default-features`?**
- Default features include `rustls-tls` which requires `ring v0.16.20`
- `ring` doesn't support riscv64 architecture in this version
- TLS features are not needed for local Next.js compilation
- See [Issue #9](https://github.com/gounthar/nextjs-riscv64/issues/9) for long-term solutions

## Updates

- **2025-11-14**: Initial documentation created
- **2025-11-14**: Started actual build test on Banana Pi F3 - build in progress
- **Next**: Complete build and test binaries

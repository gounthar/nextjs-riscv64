# Installation Guide

This guide covers all methods for getting Next.js working on riscv64 architecture.

## Quick Start

### Method 1: Use Prebuilt Binaries (Recommended)

If you already have a Next.js project:

```bash
# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/gounthar/nextjs-riscv64/main/scripts/install-riscv64-binaries.sh | bash -s -- v13.5.6 /path/to/your/project
```

Or clone the repository and run locally:

```bash
git clone https://github.com/gounthar/nextjs-riscv64.git
cd nextjs-riscv64
./scripts/install-riscv64-binaries.sh v13.5.6 /path/to/your/project
```

### Method 2: Build from Source

For the latest version or if prebuilt binaries aren't available:

```bash
# Clone the repository
git clone https://github.com/gounthar/nextjs-riscv64.git
cd nextjs-riscv64

# Build SWC (takes 2-4 hours)
./scripts/build-native-swc.sh v13.5.6

# Install to your project
cp -r builds/v13.5.6/* /path/to/your/project/node_modules/@next/swc-linux-riscv64gc-gnu/
```

### Method 3: Use Babel Fallback

For quick testing without native SWC (Pages Router only):

```bash
# Use Next.js 13.5.6
npx create-next-app@13.5.6 my-app
cd my-app

# Add Babel configuration
echo '{"presets":["next/babel"]}' > .babelrc

# Update next.config.js
cat > next.config.js <<EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
}
module.exports = nextConfig
EOF

# Build
npm run build
```

Note: Babel is 17x slower than native SWC and doesn't support App Router.

## Detailed Installation

### Prerequisites

#### Node.js

Install Node.js v24.11.1 or later for riscv64:

```bash
# Clone this repository
git clone https://github.com/gounthar/nextjs-riscv64.git
cd nextjs-riscv64

# Run the Node.js installer
./scripts/install-nodejs.sh
```

Or download directly from [nodejs-unofficial-builds](https://github.com/gounthar/unofficial-builds/releases).

#### Build Tools (for building from source)

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  gcc g++ make \
  pkg-config libssl-dev \
  git curl
```

#### Rust (for building from source)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Install required nightly toolchain
rustup toolchain install nightly-2023-10-06-riscv64gc-unknown-linux-gnu
```

### Using Prebuilt Binaries

#### Step 1: Create Your Project

```bash
npx create-next-app@13.5.6 my-app
cd my-app
npm install
```

#### Step 2: Install riscv64 Binary

Option A - Using installer script:
```bash
/path/to/nextjs-riscv64/scripts/install-riscv64-binaries.sh v13.5.6 .
```

Option B - Manual installation:
```bash
# Download binary from GitHub releases
curl -LO https://github.com/gounthar/nextjs-riscv64/releases/download/v13.5.6-riscv64-1/next-swc.linux-riscv64gc-gnu.node

# Create package directory
mkdir -p node_modules/@next/swc-linux-riscv64gc-gnu

# Install binary
mv next-swc.linux-riscv64gc-gnu.node node_modules/@next/swc-linux-riscv64gc-gnu/

# Create package.json
cat > node_modules/@next/swc-linux-riscv64gc-gnu/package.json <<EOF
{
  "name": "@next/swc-linux-riscv64gc-gnu",
  "version": "13.5.6",
  "main": "next-swc.linux-riscv64gc-gnu.node"
}
EOF
```

#### Step 3: Apply Loader Patch

The installer script does this automatically, but for manual installation:

```bash
# Apply the patch
/path/to/nextjs-riscv64/patches/apply-nextjs-patch.sh
```

Or manually edit `node_modules/next/dist/build/swc/index.js`:

Find:
```javascript
linux: {
    x64: linux.x64.filter((triple)=>triple.abi !== "gnux32"),
    arm64: linux.arm64,
    arm: linux.arm
}
```

Replace with:
```javascript
linux: {
    x64: linux.x64.filter((triple)=>triple.abi !== "gnux32"),
    arm64: linux.arm64,
    riscv64: linux.riscv64gc,  // Add this line
    arm: linux.arm
}
```

#### Step 4: Test Your Installation

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Building from Source

For maximum control or if you need a different version:

#### Step 1: Build the Binary

```bash
cd /path/to/nextjs-riscv64

# Build (takes 2-4 hours)
./scripts/build-native-swc.sh v13.5.6

# Output will be in builds/v13.5.6/
```

#### Step 2: Install to Your Project

```bash
# Copy to your project
mkdir -p /path/to/your/project/node_modules/@next/swc-linux-riscv64gc-gnu
cp builds/v13.5.6/* /path/to/your/project/node_modules/@next/swc-linux-riscv64gc-gnu/

# Apply loader patch
./patches/apply-nextjs-patch.sh /path/to/your/project
```

## Version Compatibility

| Next.js Version | Binary Status | Notes |
|-----------------|---------------|-------|
| 13.5.6 | ✅ Available | Recommended, fully tested |
| 14.x | 🔨 Build from source | Should work |
| 15.x | 🔨 Build from source | Untested |

## Common Issues

### "Failed to load SWC binary"

**Cause**: Binary not installed or loader patch not applied

**Solution**:
1. Check binary exists: `ls node_modules/@next/swc-linux-riscv64gc-gnu/`
2. Verify loader patch: `grep riscv64 node_modules/next/dist/build/swc/index.js`
3. Reinstall: `./scripts/install-riscv64-binaries.sh v13.5.6 .`

### "ring v0.16.20 build failure"

**Cause**: Default features include TLS dependencies

**Solution**: Build with `--no-default-features` (our build script does this automatically)

### "Cannot find module"

**Cause**: Missing package.json in binary directory

**Solution**:
```bash
cat > node_modules/@next/swc-linux-riscv64gc-gnu/package.json <<EOF
{
  "name": "@next/swc-linux-riscv64gc-gnu",
  "version": "13.5.6",
  "main": "next-swc.linux-riscv64gc-gnu.node"
}
EOF
```

### Binary loads but builds fail

**Cause**: Version mismatch between Next.js and binary

**Solution**: Ensure binary version matches installed Next.js version

### App Router not working

**Cause**: Using Babel fallback (doesn't support App Router)

**Solution**: Install native SWC binary using methods 1 or 2 above

## Performance Comparison

| Method | Build Time | App Router Support | Setup Time |
|--------|------------|-------------------|------------|
| Native SWC | ~3-4s | ✅ Full | Medium (install binary) |
| Babel Fallback | ~60s | ❌ Pages only | Quick |
| Build from Source | - | ✅ Full | Long (2-4h build) |

## After npm Update

When you run `npm install` or update dependencies, you may need to reinstall the riscv64 binaries:

```bash
./scripts/install-riscv64-binaries.sh v13.5.6 .
```

Consider adding this to your postinstall script in package.json:

```json
{
  "scripts": {
    "postinstall": "curl -fsSL https://raw.githubusercontent.com/gounthar/nextjs-riscv64/main/scripts/install-riscv64-binaries.sh | bash -s -- v13.5.6 ."
  }
}
```

## Getting Help

- **Issues**: https://github.com/gounthar/nextjs-riscv64/issues
- **Discussions**: Open a GitHub issue with questions
- **Documentation**: See other docs in this repository

## Next Steps

- [Building SWC Guide](BUILDING-SWC.md) - Detailed build instructions
- [SWC Workarounds](SWC-WORKAROUNDS.md) - Alternative approaches
- [Prebuilt Strategy](PREBUILT-BINARIES-STRATEGY.md) - Distribution plans

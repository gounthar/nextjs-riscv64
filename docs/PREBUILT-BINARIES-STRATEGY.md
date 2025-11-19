# Prebuilt Binaries Strategy for riscv64

This document outlines the strategy for creating, hosting, and distributing prebuilt native Node.js module binaries for riscv64 architecture.

## Executive Summary

**Recommendation**: Hybrid approach combining GitHub Releases for immediate value with upstream contribution efforts for long-term sustainability.

- **Short-term**: Host binaries via GitHub Releases + automated build scripts
- **Medium-term**: Publish to npm as scoped packages (`@riscv64/*`)
- **Long-term**: Contribute to upstream projects for official support

## Current State

### Lessons Learned from @next/swc Build

From our successful native SWC build experience:

1. **Build Time**: 2-4 hours on Banana Pi F3 (8 cores, 15GB RAM)
2. **Critical Workaround**: Must use `--no-default-features` to avoid `ring v0.16.20` compilation failure
3. **Binary Location**: `target/release/libnext_swc_napi.so`
4. **Naming Convention**: Must match `@napi-rs/triples` expectations (`linux-riscv64gc-gnu`)
5. **Loader Patch**: Next.js requires a one-line patch to recognize riscv64

### Priority Packages

Based on Next.js ecosystem usage patterns:

| Package | Priority | Build Difficulty | Status |
|---------|----------|------------------|--------|
| @next/swc | Critical | High (2-4h) | ✅ Built successfully |
| sharp | High | Medium | Pending audit |
| bcrypt | Medium | Low | Pending audit |
| sqlite3 | Medium | Low | Pending audit |
| canvas | Low | High | Pending audit |
| argon2 | Low | Medium | Pending audit |

## Distribution Strategy Analysis

### Option A: GitHub Releases + Prebuildify

**Approach**: Use `prebuildify` tooling and host binaries as GitHub Release assets.

**Pros**:
- Free hosting with no maintenance
- Versioning aligned with releases
- Easy CI/CD integration
- Familiar to open source community

**Cons**:
- Users must know about this repository
- Manual download required (unless automated)
- Not discoverable via npm

**Implementation**:
```bash
# Users download from releases
curl -LO https://github.com/gounthar/nextjs-riscv64/releases/download/v13.5.6/next-swc.linux-riscv64gc-gnu.node
```

**Verdict**: ✅ **Recommended for short-term**

### Option B: Scoped npm Registry

**Approach**: Publish as scoped packages (e.g., `@riscv64/next-swc`).

**Pros**:
- Transparent npm installation
- Automatic version resolution
- Standard npm workflows

**Cons**:
- Maintenance overhead
- Potential confusion with official packages
- Requires npm authentication setup

**Implementation**:
```bash
# Users install scoped package
npm install @riscv64/next-swc-linux-riscv64gc-gnu

# Or via postinstall script
"postinstall": "riscv64-binaries install"
```

**Verdict**: ⏸️ **Consider for medium-term**

### Option C: Upstream Contributions

**Approach**: Submit PRs to add riscv64 to official CI/CD pipelines.

**Pros**:
- Best long-term solution
- No maintenance burden
- Official support and compatibility

**Cons**:
- Requires upstream acceptance
- Longer timeline
- May need hardware sponsorship

**Implementation**:
```yaml
# Example: Add to Vercel's CI matrix
jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: [self-hosted, linux, riscv64]
            target: riscv64gc-unknown-linux-gnu
```

**Verdict**: ✅ **Essential for long-term sustainability**

### Option D: Local Compilation Scripts

**Approach**: Provide scripts that compile on first install.

**Pros**:
- Always builds fresh
- No hosting required
- Works with any version

**Cons**:
- Slow (2-4 hours for SWC)
- Requires build tools (Rust, gcc)
- May fail on constrained systems

**Implementation**:
```bash
# Users run build script
./scripts/build-native-swc.sh v13.5.6
```

**Verdict**: ✅ **Essential fallback option**

## Recommended Hybrid Strategy

### Phase 1: Immediate Value (Now)

**Goal**: Provide working binaries for early adopters

1. **GitHub Releases**
   - Host prebuilt binaries as release assets
   - Version tags match Next.js versions (e.g., `v13.5.6-riscv64`)
   - Include checksums and signatures

2. **Build Scripts**
   - Provide automated build scripts
   - Document prerequisites clearly
   - Include troubleshooting guides

3. **Installer Script**
   - One-command installation
   - Downloads correct version automatically
   - Applies necessary patches

### Phase 2: Improved UX (1-2 months)

**Goal**: Streamline installation process

1. **npm Postinstall Hook**
   - Check architecture on `npm install`
   - Auto-download riscv64 binaries
   - Apply loader patch automatically

2. **npx Installer**
   - `npx @riscv64/next-setup`
   - Interactive version selection
   - Verification and testing

3. **Documentation**
   - Comprehensive guides
   - Troubleshooting database
   - Community examples

### Phase 3: Ecosystem Integration (3-6 months)

**Goal**: Reduce friction and maintenance

1. **Scoped npm Packages**
   - Publish `@riscv64/next-swc-linux-riscv64gc-gnu`
   - Automated releases via CI
   - Version parity with upstream

2. **CI/CD Pipeline**
   - Automated builds on release
   - Cross-compilation from x64 (faster)
   - Automated testing

3. **Upstream Engagement**
   - Open issues with Vercel/Next.js
   - Provide test hardware access
   - Submit CI/CD contributions

### Phase 4: Official Support (6-12 months)

**Goal**: Make this repository unnecessary

1. **Vercel/Next.js**
   - Official @next/swc riscv64 binaries
   - Loader recognition without patch

2. **Other Packages**
   - sharp, bcrypt, etc. with riscv64 prebuilds
   - Upstream CI/CD additions

## Build Infrastructure

### Current Setup

- **Hardware**: Banana Pi F3 (riscv64, 8 cores, 15GB RAM)
- **OS**: Debian 13 (Trixie)
- **Tools**: Rust 1.91.1, Node.js v24.11.1

### Required Build Environment

```bash
# System dependencies
sudo apt-get install -y \
  build-essential gcc g++ make \
  pkg-config libssl-dev git

# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup toolchain install nightly-2023-10-06-riscv64gc-unknown-linux-gnu

# Node.js tools
npm install -g pnpm
```

### Cross-Compilation Alternative

For faster builds, cross-compile from x64:

```bash
# On x64 machine
rustup target add riscv64gc-unknown-linux-gnu
sudo apt-get install gcc-riscv64-linux-gnu

# Build
cargo build --release --target riscv64gc-unknown-linux-gnu
```

**Trade-offs**:
- ✅ 10-20x faster than native builds
- ❌ May miss runtime issues
- ⚠️ Requires testing on real hardware

## Release Process

### Naming Convention

Follow prebuildify standards:
```
{name}.{platform}-{arch}{abi}.node
```

Examples:
- `next-swc.linux-riscv64gc-gnu.node`
- `sharp-linux-riscv64gc.node`

### Version Tagging

Use compound tags to track both package and binary versions:
```
v{package-version}-riscv64-{build-number}
```

Examples:
- `v13.5.6-riscv64-1` (first build of Next.js 13.5.6)
- `v13.5.6-riscv64-2` (rebuild with fixes)

### Release Assets

Each release should include:

```
nextjs-riscv64-v13.5.6-riscv64-1/
├── next-swc.linux-riscv64gc-gnu.node     # Main binary
├── SHA256SUMS                            # Checksums
├── BUILD-INFO.md                         # Build metadata
└── INSTALL.md                            # Installation instructions
```

### Build Metadata

Include in `BUILD-INFO.md`:
```markdown
## Build Information

- **Package**: @next/swc
- **Version**: 13.5.6
- **Platform**: linux-riscv64gc-gnu
- **Build Date**: 2025-11-19
- **Hardware**: Banana Pi F3 (SpacemiT K1)
- **Rust Version**: 1.91.1
- **Build Flags**: `--no-default-features`
- **SHA256**: abc123...
```

## Installation Methods

### Method 1: Automated Installer (Recommended)

```bash
# Install via script
curl -fsSL https://raw.githubusercontent.com/gounthar/nextjs-riscv64/main/scripts/install-riscv64-binaries.sh | bash
```

### Method 2: Manual Download

```bash
# Download binary
curl -LO https://github.com/gounthar/nextjs-riscv64/releases/download/v13.5.6-riscv64-1/next-swc.linux-riscv64gc-gnu.node

# Verify checksum
sha256sum -c SHA256SUMS

# Install to project
mkdir -p node_modules/@next/swc-linux-riscv64gc-gnu
cp next-swc.linux-riscv64gc-gnu.node node_modules/@next/swc-linux-riscv64gc-gnu/
```

### Method 3: Build from Source

```bash
# Clone build scripts
git clone https://github.com/gounthar/nextjs-riscv64.git
cd nextjs-riscv64

# Build SWC
./scripts/build-native-swc.sh v13.5.6

# Binary available at: builds/v13.5.6/next-swc.linux-riscv64gc-gnu.node
```

## Automated Build Scripts

### build-native-swc.sh

Main build script for @next/swc:

```bash
#!/bin/bash
# Build @next/swc for riscv64
# Usage: ./scripts/build-native-swc.sh <version>

set -euo pipefail

VERSION="${1:-v13.5.6}"
BUILD_DIR="/tmp/nextjs-swc-build"
OUTPUT_DIR="${2:-./builds/${VERSION}}"

# ... (see full implementation in scripts/)
```

### verify-binary.sh

Test binary functionality:

```bash
#!/bin/bash
# Verify SWC binary works correctly
# Usage: ./scripts/verify-binary.sh <binary-path>

# Load binary via Node.js
node -e "require('$1'); console.log('Binary loaded successfully')"
```

## Testing Strategy

### Binary Verification

1. **Load Test**: Ensure binary loads in Node.js
2. **Compilation Test**: Compile sample TypeScript/JSX
3. **Integration Test**: Build full Next.js app
4. **Performance Test**: Compare with Babel fallback

### Test Matrix

| Test | Next.js Version | Router Type | Expected Result |
|------|----------------|-------------|-----------------|
| Pages Router SSG | 13.5.6 | Pages | ✅ Build success |
| Pages Router SSR | 13.5.6 | Pages | ✅ Build success |
| App Router | 13.5.6 | App | ✅ Build success |
| Dev Server | 13.5.6 | Both | ✅ Hot reload works |
| TypeScript | 13.5.6 | Both | ✅ Type checking |

## Upstream Engagement Plan

### Next.js / Vercel

**Objective**: Get official @next/swc riscv64 binaries

**Actions**:
1. Open RFC issue requesting riscv64 support
2. Offer to sponsor CI runner hardware
3. Submit PR adding riscv64 to build matrix
4. Provide test results and benchmarks

**Contacts**:
- GitHub: https://github.com/vercel/next.js
- Issue tracker: Focus on SWC binary requests

### SWC Project

**Objective**: Ensure base SWC supports riscv64

**Actions**:
1. Verify SWC compiles on riscv64
2. Report any architecture-specific issues
3. Contribute riscv64 test cases

### ring Crate

**Objective**: Get native riscv64 support in ring

**Actions**:
1. Track https://github.com/briansmith/ring/issues
2. Test with newer ring versions
3. Report build issues with detailed logs

**Current Workaround**: Use `--no-default-features` to skip TLS

## Maintenance Plan

### Regular Tasks

- **Weekly**: Check for new Next.js releases
- **Monthly**: Rebuild with security updates
- **Quarterly**: Review upstream progress

### Automation

- GitHub Actions for builds (when self-hosted runners available)
- Renovate/Dependabot for dependency updates
- Automated release notes generation

### Community Support

- Monitor GitHub issues
- Maintain troubleshooting guide
- Collect community feedback

## Success Metrics

### Short-term (Phase 1-2)

- [ ] First binary release published
- [ ] 10+ downloads from community
- [ ] Installation documented and tested
- [ ] Troubleshooting guide created

### Medium-term (Phase 3)

- [ ] npm packages published
- [ ] 100+ monthly downloads
- [ ] Community contributions
- [ ] Other packages covered (sharp, bcrypt)

### Long-term (Phase 4)

- [ ] Upstream PR accepted
- [ ] Official Vercel binaries
- [ ] This repo becomes archive/reference only

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up build scripts
- [ ] Create first binary release
- [ ] Write installation documentation

### Week 3-4: Automation
- [ ] Automated installer script
- [ ] Verification test suite
- [ ] CI/CD pipeline (manual triggers)

### Month 2: Distribution
- [ ] npm package structure
- [ ] Community testing
- [ ] Feedback collection

### Month 3+: Upstream
- [ ] Submit upstream issues/PRs
- [ ] Engage with maintainers
- [ ] Long-term sustainability planning

## Appendix

### A. Prebuildify Reference

Prebuildify creates platform-specific binaries:
```bash
npm install prebuildify
npx prebuildify --napi --strip
```

### B. @napi-rs/triples Architecture Keys

For riscv64:
```javascript
{
  platform: 'linux',
  arch: 'riscv64',
  abi: 'gnu',
  platformArchABI: 'linux-riscv64gc-gnu'
}
```

### C. Related Issues

- Issue #1: Runtime Testing (✅ Complete)
- Issue #2: Native Dependencies Audit (In Progress)
- Issue #3: Prebuilt Binaries Strategy (This Document)
- Issue #7: Upstream Engagement
- Issue #9: ring crate workaround (✅ Solved)

## References

- [Prebuildify Documentation](https://github.com/prebuild/prebuildify)
- [N-API Native Addons](https://nodejs.org/api/n-api.html)
- [@napi-rs/triples](https://github.com/nicolo-ribaudo/napi-rs)
- [Next.js SWC](https://nextjs.org/docs/architecture/nextjs-compiler)

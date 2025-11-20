# Native Dependencies Audit for riscv64

This document provides a comprehensive audit of native Node.js modules commonly used in the Next.js ecosystem, analyzing their riscv64 support status and build requirements.

**Last Updated**: 2025-11-20 (hardware tested on Banana Pi F3)

## Executive Summary

Out of 20+ native modules analyzed, only **3 provide official riscv64 prebuilt binaries**. Most modules require building from source on riscv64, with varying degrees of difficulty. **Hardware tested on Banana Pi F3** (2025-11-20): Sharp WASM works perfectly, but Prisma has a critical WASM parser bug.

### Quick Reference

| Support Level | Count | Description |
|---------------|-------|-------------|
| **Full Support** | 3 | Official prebuilt binaries available (esbuild, rollup) |
| **WASM Works** | 1 | Sharp WASM fully functional ✅ (hardware tested) |
| **Experimental** | 1 | Work-in-progress native support (Sharp native) |
| **Build from Source** | 11 | Must compile locally, generally works |
| **Broken** | 1 | Prisma - WASM parser bug, no workaround ❌ |
| **No Support** | 3 | Platform-specific (fsevents) or deprecated (node-sass) |

## Compatibility Matrix

### Core Next.js Dependencies

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **@next/swc** | No | Rust | Medium | Use `--no-default-features` to avoid ring v0.16.20 |
| **sharp** | WASM works ✅ | C/C++ | Easy (WASM) / Hard (native) | WASM: `npm install --cpu=wasm32 sharp` |
| **esbuild** | **Yes** | Go | N/A | `@esbuild/linux-riscv64` available |
| **lightningcss** | No (PR closed) | Rust | Medium | PR #651 was closed without merge |
| **turbo** | No | Rust | Medium | Not commonly needed for Next.js apps |

### Build Tools & Bundlers

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **rollup** | **Yes** | Rust | N/A | `@rollup/rollup-linux-riscv64-gnu/musl` |
| **swc (standalone)** | No | Rust | Medium | Same as @next/swc |

### Database Modules

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **better-sqlite3** | No | C++ | Easy | Pure SQLite, builds cleanly |
| **sqlite3** | No | C++ | Easy | Uses node-pre-gyp |
| **prisma** | ❌ Broken | Rust | N/A | WASM parser bug - does not work on riscv64 |
| **lmdb** | No | C | Medium | Falls back to JS if native unavailable |

### Authentication & Security

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **bcrypt** | No | C++ | Easy | Standard node-gyp build |
| **argon2** | No | C | Medium | Requires GCC >= 5 |
| **keytar** | No | C++ | Medium | Requires libsecret-1-dev on Linux |

### Image & Graphics

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **sharp** | WASM works ✅ | C/C++ | Easy (WASM) / Hard (native) | Hardware tested: WASM fully functional |
| **canvas** (node-canvas) | No | C | Medium | Requires Cairo, Pango |
| **skia-canvas** | No | Rust | Hard | Requires Rust toolchain |

### Serialization & Performance

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **msgpackr** | No | C++ | Easy | Falls back to JS mode |
| **msgpackr-extract** | No | C++ | Easy | Optional native addon |

### System & Platform

| Module | riscv64 Prebuilds | Language | Build Difficulty | Notes |
|--------|-------------------|----------|------------------|-------|
| **fsevents** | N/A | Obj-C | N/A | macOS only - skipped on Linux |
| **node-sass** | No (deprecated) | C++ | Medium | Use `sass` (Dart Sass) instead |
| **isolated-vm** | No | C++ | Hard | Depends on V8 internals |

## Detailed Analysis

### 1. @next/swc - PRIORITY HIGH

**Status**: No prebuilt binaries, must build from source

**Build Requirements**:
- Rust stable + nightly-2023-10-06
- `--no-default-features` flag required (avoids ring v0.16.20)
- Build time: 2-4 hours on Banana Pi F3

**Issues**:
- `ring v0.16.20` doesn't support riscv64
- No official Vercel support planned

**Workarounds**:
1. Use loader patch + pre-built binaries (see `patches/apply-nextjs-patch.sh`)
2. Babel fallback for Next.js 13.5.6 (Pages Router only)
3. Build from source

**References**:
- [1] gounthar. "nextjs-riscv64 BUILDING-SWC.md" GitHub, 2025. https://github.com/gounthar/nextjs-riscv64/blob/main/docs/BUILDING-SWC.md
- [2] Vercel. "Next.js SWC Compiler" Next.js Docs. https://nextjs.org/docs/architecture/nextjs-compiler

---

### 2. sharp - PRIORITY HIGH

**Status**: ✅ **WASM Works**, Native Experimental (June 2025)

**Hardware Test Results** (Banana Pi F3, 2025-11-20):
- Sharp 0.34.5 with WASM backend: **Fully functional**
- All operations tested successfully (resize, format conversion, blur, rotate, composite)
- No crashes or errors on real riscv64 hardware

**WASM Performance** (Banana Pi F3, 8 cores, Node.js v20.19.2):

| Image Size | Resize | JPEG→WebP | PNG→JPEG | Blur | Grayscale |
|------------|--------|-----------|----------|------|-----------|
| **640×480** (small) | 169ms | 266ms | 67ms | 307ms | 67ms |
| **1280×720** (medium) | 315ms | 778ms | 152ms | 882ms | 166ms |
| **1920×1080** (large) | 604ms | 1753ms | 310ms | 1939ms | 345ms |
| **3840×2160** (4K) | 606ms | 6949ms | 1228ms | 7686ms | 1279ms |

**Performance Analysis**:
- Small images: 57-307ms per operation
- 4K images: 606-7686ms for heavy operations (blur, WebP conversion)
- Performance scales predictably with image size
- Suitable for development and low-traffic production

**Recommendations**:
1. **Development/Testing**: Use WASM (`npm install --cpu=wasm32 sharp`) - zero compilation needed
2. **Production (Low Traffic)**: WASM acceptable for < 1000 images/day
3. **Production (High Traffic)**: Build native libvips for 3-4x speedup (see [BUILDING-LIBVIPS.md](BUILDING-LIBVIPS.md))

**Native Binary Status**:
- Work-in-progress in sharp-libvips
- Requires glibc >= 2.41 (Ubuntu 25.04+ or Debian 13)
- Compiler flag: `-march=rv64gc`
- libvips >= 8.15.3
- Known issue: Segfaults under QEMU emulation
- No native hardware testing by maintainers yet

**Workarounds**:
1. **WASM** (Recommended): `npm install --cpu=wasm32 sharp` - ✅ Works perfectly
2. **Build libvips from source**: Set `SHARP_FORCE_GLOBAL_LIBVIPS=1` (see [BUILDING-LIBVIPS.md](BUILDING-LIBVIPS.md))
3. Use `@img/sharp-wasm32` package (alternative WASM distribution)

**Testing**:
- Benchmark script: `tests/native-deps-audit/sharp-benchmark.js`
- Full test results: [docs/testing/native-deps-test-results-2025-11-20.md](testing/native-deps-test-results-2025-11-20.md)
- Build guide: [BUILDING-LIBVIPS.md](BUILDING-LIBVIPS.md)

**References**:
- [3] lovell. "Prebuilt binaries for linux-riscv64" sharp#4367. https://github.com/lovell/sharp/issues/4367
- [4] lovell. "Enhancement: provide prebuilt binaries for linux-riscv64" sharp-libvips#223. https://github.com/lovell/sharp-libvips/issues/223
- Hardware test results: [native-deps-test-results-2025-11-20.md](testing/native-deps-test-results-2025-11-20.md)

---

### 3. esbuild - FULL SUPPORT

**Status**: Official prebuilt binaries available

**Package**: `@esbuild/linux-riscv64`

**Stats**:
- Weekly downloads: 4.8M+
- Current version: 0.25.5
- Size: ~6MB

**Usage**:
```bash
npm install esbuild
# Automatically installs @esbuild/linux-riscv64 on riscv64
```

**Notes**: esbuild is written in Go which has good riscv64 support. This is one of the best-supported modules for the platform.

**References**:
- [5] evanw. "@esbuild/linux-riscv64" npm. https://www.npmjs.com/package/@esbuild/linux-riscv64

---

### 4. rollup - FULL SUPPORT

**Status**: Official prebuilt binaries available

**Packages**:
- `@rollup/rollup-linux-riscv64-gnu` (glibc)
- `@rollup/rollup-linux-riscv64-musl` (musl)

**Current Version**: 4.52.5

**Usage**:
```bash
npm install rollup
# Automatically selects appropriate riscv64 binary
```

**References**:
- [6] rollup. "@rollup/rollup-linux-riscv64-gnu" npm. https://www.npmjs.com/package/@rollup/rollup-linux-riscv64-gnu

---

### 5. lightningcss - PRIORITY MEDIUM

**Status**: PR #651 closed without merge (April 2025)

**Reason for Closure**: Maintainer concerns about:
- Limited real-world hardware support
- No way to test the platform
- Node.js riscv64 support questions

**Build from Source**:
```bash
# Requires Rust toolchain
cargo build --release --target riscv64gc-unknown-linux-gnu
```

**References**:
- [7] phanen. "feat(target): add riscv64 support" lightningcss#651. https://github.com/parcel-bundler/lightningcss/pull/651

---

### 6. Prisma - PRIORITY MEDIUM

**Status**: ❌ **DOES NOT WORK** on riscv64 (WASM parser bug)

**Hardware Test Results** (Banana Pi F3, 2025-11-20):
- Prisma 6.16.0 and 7.0.0 both fail during schema generation
- Error: `RuntimeError: panicked at pest-2.8.1/src/iterators/pairs.rs:70:29: index out of bounds`
- Root cause: Bug in WASM-compiled `pest` parser library on riscv64
- Both `engineType: "client"` (JS-only) and native engine modes fail
- Even basic schema validation crashes before any engine execution

**Impact**:
- ❌ Prisma cannot be used on riscv64 at all
- ❌ No workaround available with current versions
- ❌ Affects both Prisma 6.x and 7.x

**Alternatives for Database Access on riscv64**:

1. **Direct Database Clients** (Recommended):
   - `pg` (PostgreSQL) - ✅ Pure JavaScript, works perfectly
   - `mysql2` (MySQL/MariaDB) - ✅ Works
   - `better-sqlite3` (SQLite) - ✅ Compiles and works

2. **Other ORMs**:
   - `sequelize` - Pure JavaScript ORM
   - `typeorm` - TypeScript ORM with wide support
   - `knex` - Query builder with no native dependencies

3. **Remote Prisma Architecture**:
   - Run Prisma on x64/arm64 server
   - Access via REST/GraphQL API from riscv64 application
   - Use Prisma Data Proxy

**Testing**:
- Test script: `tests/native-deps-audit/prisma-jsonly-test.js`
- Full test results: [docs/testing/native-deps-test-results-2025-11-20.md](testing/native-deps-test-results-2025-11-20.md)

**Upstream Action Needed**:
- [ ] Report WASM parser bug to Prisma team
- [ ] Request riscv64 native engine support
- [ ] Offer Banana Pi F3 hardware for testing

**References**:
- [8] Prisma. "Prisma without Rust Engines" Prisma Docs. https://www.prisma.io/docs/orm/more/under-the-hood/engines
- Hardware test results: [native-deps-test-results-2025-11-20.md](testing/native-deps-test-results-2025-11-20.md)

---

### 7. bcrypt / argon2 - PRIORITY LOW

**Status**: Build from source (straightforward)

**bcrypt Requirements**:
- node-gyp
- GCC/G++
- Python 3

**argon2 Requirements**:
- GCC >= 5 or Clang >= 3.3
- node-gyp

**Build Commands**:
```bash
# bcrypt
npm install bcrypt  # auto-builds

# argon2 (if prebuild fails)
npm install argon2 --ignore-scripts
npx node-gyp rebuild -C ./node_modules/argon2
```

**References**:
- [9] kelektiv. "node.bcrypt.js" GitHub. https://github.com/kelektiv/node.bcrypt.js
- [10] ranisalt. "node-argon2" GitHub. https://github.com/ranisalt/node-argon2

---

### 8. better-sqlite3 / sqlite3 - PRIORITY LOW

**Status**: Build from source (easy)

**Requirements**:
- node-gyp
- Python 3
- GCC/G++

**Notes**:
- SQLite is pure C, compiles cleanly
- No external library dependencies
- Falls back to node-gyp build automatically

**References**:
- [11] WiseLibs. "better-sqlite3" GitHub. https://github.com/WiseLibs/better-sqlite3

---

### 9. canvas (node-canvas) - PRIORITY LOW

**Status**: Build from source

**System Dependencies**:
```bash
# Debian/Ubuntu
sudo apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev
```

**Build**:
```bash
npm install canvas --build-from-source
```

**References**:
- [12] Automattic. "node-canvas" GitHub. https://github.com/Automattic/node-canvas

---

### 10. node-sass - DEPRECATED

**Status**: Deprecated, no riscv64 prebuilds

**Recommended Migration**:
```bash
# Replace node-sass with sass (Dart Sass)
npm uninstall node-sass
npm install sass
```

**Benefits of Migration**:
- No native compilation required
- Pure JavaScript/Dart
- Full Sass feature support
- Active maintenance

**References**:
- [13] sass. "node-sass deprecation" GitHub. https://github.com/sass/node-sass

---

## Build Difficulty Assessment

### Easy (< 5 minutes)
- **better-sqlite3**: Pure C, no external deps
- **sqlite3**: Pure C, no external deps
- **bcrypt**: Standard C++, well-tested
- **msgpackr**: Optional native addon

### Medium (5-30 minutes)
- **argon2**: Requires newer GCC
- **keytar**: Needs libsecret-dev
- **canvas**: Multiple system dependencies
- **lmdb**: Some configuration needed
- **lightningcss**: Rust build

### Hard (30+ minutes to hours)
- **@next/swc**: 2-4 hour build, ring workaround needed
- **sharp**: Complex libvips dependencies
- **prisma**: Large Rust codebase
- **skia-canvas**: Heavy Rust/Skia dependencies
- **isolated-vm**: V8 internals knowledge needed

## Recommendations

### High Priority Packages to Support

1. **@next/swc** - Critical for Next.js performance
   - Continue maintaining pre-built binaries
   - Document build process thoroughly
   - Push for upstream support

2. **sharp** - Essential for Next.js Image Optimization
   - Track experimental support in sharp-libvips
   - Test WASM fallback as alternative
   - Document libvips build process

3. **lightningcss** - Growing adoption in modern toolchains
   - Consider reopening PR with better testing
   - Provide hardware for maintainer testing

### Alternative Strategies

For modules without riscv64 support, consider:

1. **JavaScript alternatives**:
   - `bcryptjs` instead of `bcrypt`
   - `sass` instead of `node-sass`
   - `sql.js` instead of `better-sqlite3`

2. **WASM fallbacks**:
   - `@img/sharp-wasm32` for sharp
   - Pure JS mode for msgpackr

3. **Architecture-agnostic options**:
   - Prisma with `engineType: "client"`
   - Remote database connections
   - API-based image processing

### CI/CD Recommendations

For automated builds on riscv64:

```yaml
# Example GitHub Actions (requires self-hosted runner)
jobs:
  build:
    runs-on: [self-hosted, riscv64]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        run: |
          # Use unofficial Node.js builds for riscv64
          curl -fsSL https://github.com/gounthar/unofficial-builds/releases/download/v24.11.1/node-v24.11.1-linux-riscv64.tar.gz | tar -xz

      - name: Install dependencies
        run: npm ci --build-from-source

      - name: Build
        run: npm run build
```

### Ecosystem Engagement

Help improve riscv64 support:

1. **Open Issues**: Request support in individual repositories
2. **Provide Testing**: Offer access to riscv64 hardware
3. **Contribute PRs**: Add riscv64 to CI build matrices
4. **Fund Development**: Sponsor maintainers working on support

## Technical Insights

### Common Patterns

1. **Rust modules** (SWC, Prisma, lightningcss): Generally buildable but may have dependency issues (e.g., ring crate)

2. **C/C++ modules** (bcrypt, sqlite3, canvas): Usually straightforward with node-gyp, need system dependencies

3. **Go modules** (esbuild): Excellent riscv64 support out of the box

### Best Practices

1. **Always check for prebuilds first**: `npm install --prefer-offline`
2. **Use node-gyp-build compatible packages**: They handle fallback gracefully
3. **Install system dependencies before npm install**: Prevents rebuild failures
4. **Pin versions**: Native module APIs can break between versions

### Pitfalls to Avoid

1. **Don't assume x64 patterns work**: Some optimizations are architecture-specific
2. **Watch glibc versions**: Many prebuilds require glibc 2.31+
3. **Avoid `--no-optional`**: May skip necessary platform packages
4. **Test on actual hardware**: QEMU has known issues with some modules

## Community Resources

### RISC-V Software Ecosystem
- RISC-V Software Ports: https://wiki.riscv.org/display/HOME/Software+Ports
- Node.js riscv64 issue: https://github.com/nodejs/node/issues/37856

### Unofficial Builds
- Node.js riscv64: https://github.com/gounthar/unofficial-builds
- This project: https://github.com/gounthar/nextjs-riscv64

### Upstream Projects
- Next.js: https://github.com/vercel/next.js
- SWC: https://github.com/swc-project/swc
- Sharp: https://github.com/lovell/sharp

## Testing Tools

Automated testing scripts are available in `tests/native-deps-audit/` to validate module functionality on riscv64:

### Sharp Performance Benchmark

**Location**: `tests/native-deps-audit/sharp-benchmark.js`

Tests native libvips vs WASM performance across multiple operations:
- Image resizing (640x480 to 3840x2160)
- Format conversions (JPEG, PNG, WebP)
- Transformations (rotate, blur, grayscale)
- Composite operations

**Usage**:
```bash
node sharp-benchmark.js --implementation=both
```

**Expected Output**: Performance comparison showing native is typically 3-4x faster

### Prisma JS-Only Mode Test

**Location**: `tests/native-deps-audit/prisma-jsonly-test.js`

Validates Prisma Client in JavaScript-only mode (no Rust engines):
- Client generation with `engineType: "client"`
- CRUD operations
- Relations and transactions
- Performance benchmarking

**Usage**:
```bash
node prisma-jsonly-test.js setup
node prisma-jsonly-test.js test
node prisma-jsonly-test.js cleanup
```

**Expected Output**: All tests pass, confirming JS-only mode works

### Documentation

See [tests/native-deps-audit/README.md](../tests/native-deps-audit/README.md) for complete testing documentation, troubleshooting, and contribution guidelines.

---

## Updates Log

- **2025-11-20**: Added testing tools section with automated test scripts
- **2025-11-20**: Added libvips build guide reference
- **2025-11-20**: Added prebuild hosting strategy
- **2025-11-19**: Initial comprehensive audit
- **2025-11-19**: Added 20+ native modules analysis
- **2025-11-19**: Documented sharp experimental support status
- **2025-11-19**: Added build difficulty assessments

## Related Documents

- [BUILDING-SWC.md](BUILDING-SWC.md) - Complete guide to building @next/swc
- [BUILDING-LIBVIPS.md](BUILDING-LIBVIPS.md) - Build libvips from source for sharp
- [PREBUILD-HOSTING-STRATEGY.md](PREBUILD-HOSTING-STRATEGY.md) - Distribution and hosting strategy
- [SWC-WORKAROUNDS.md](SWC-WORKAROUNDS.md) - Babel fallback and alternatives
- [tests/native-deps-audit/](../tests/native-deps-audit/) - Automated testing scripts
- Issue #2: Native Dependencies Audit (this document)
- Issue #3: Prebuilt Binaries Strategy
- Issue #9: ring crate compilation failure
- Issue #21: Debian/Fedora Packaging

---

**Summary**: While riscv64 prebuilt binary support is limited, most essential modules CAN be built from source. The ecosystem is gradually improving, with esbuild and rollup leading the way with official support. Focus efforts on @next/swc and sharp as they are the most impactful for Next.js applications.

# Native Dependencies Audit - Summary for Issue #2

## Overview

Comprehensive audit completed on 2025-11-19. Analyzed 20+ native Node.js modules commonly used in Next.js projects for riscv64 compatibility.

**Key Finding**: Only 3 modules provide official riscv64 prebuilt binaries, but all critical modules CAN be built from source.

## Compatibility Matrix

### Modules with Official riscv64 Support

| Module | Package | Status |
|--------|---------|--------|
| **esbuild** | `@esbuild/linux-riscv64` | Full support, 4.8M+ weekly downloads |
| **rollup** | `@rollup/rollup-linux-riscv64-gnu` | Full support |
| **rollup** | `@rollup/rollup-linux-riscv64-musl` | Full support |

### Core Next.js Dependencies

| Module | Prebuilds | Build Difficulty | Workaround |
|--------|-----------|------------------|------------|
| **@next/swc** | No | Medium (2-4h) | Build with `--no-default-features`, use loader patch |
| **sharp** | Experimental | Hard | WASM fallback or build libvips from source |
| **lightningcss** | No | Medium | Build from source (Rust) |
| **turbo** | No | Medium | Build from source (Rust) |

### Common Project Dependencies

| Module | Prebuilds | Build Difficulty | Notes |
|--------|-----------|------------------|-------|
| **bcrypt** | No | Easy | Standard node-gyp build |
| **argon2** | No | Medium | Requires GCC >= 5 |
| **better-sqlite3** | No | Easy | Pure C, no external deps |
| **sqlite3** | No | Easy | Pure C, no external deps |
| **prisma** | No | N/A | Use `engineType: "client"` (v6.16.0+) |
| **canvas** | No | Medium | Requires Cairo, Pango |
| **keytar** | No | Medium | Requires libsecret-dev |
| **lmdb** | No | Medium | Falls back to JS mode |
| **msgpackr** | No | Easy | Falls back to JS mode |
| **node-sass** | No | Deprecated | Use `sass` (Dart Sass) instead |

### Platform-Specific (Not Applicable)

| Module | Notes |
|--------|-------|
| **fsevents** | macOS only - automatically skipped on Linux |

## Priority Recommendations

### High Priority

1. **@next/swc** - Already addressed in this project
   - Pre-built binaries available
   - Loader patch documented
   - Build process documented in `docs/BUILDING-SWC.md`

2. **sharp** - Track experimental support
   - Experimental binaries being tested (requires glibc 2.41+)
   - WASM fallback available: `npm install --cpu=wasm32 sharp`
   - Manual libvips build possible

### Medium Priority

3. **lightningcss** - Consider upstream engagement
   - PR #651 was closed due to lack of testing hardware
   - Could be reopened with proper testing resources

4. **Prisma** - Use JavaScript-only mode
   - Set `engineType: "client"` in schema
   - No Rust binaries needed

### Low Priority (Build from Source Works)

- bcrypt, argon2, better-sqlite3, sqlite3, canvas, keytar, lmdb

## JavaScript Alternatives

For zero-native-compilation deployments:

| Native Module | JS Alternative | Notes |
|---------------|----------------|-------|
| bcrypt | bcryptjs | ~30% slower, pure JS |
| node-sass | sass | Dart Sass, recommended |
| better-sqlite3 | sql.js | WASM-based SQLite |
| sharp | @img/sharp-wasm32 | WebAssembly version |
| msgpackr (native) | msgpackr (js) | Automatic fallback |

## Build Requirements Summary

### System Dependencies (Debian/Ubuntu)

```bash
# Basic build tools
sudo apt-get install -y \
  build-essential \
  python3 \
  gcc \
  g++ \
  make

# For Rust-based modules (@next/swc, lightningcss)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# For canvas
sudo apt-get install -y \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev

# For keytar
sudo apt-get install -y libsecret-1-dev

# For sharp (build from source)
sudo apt-get install -y \
  libvips-dev \
  libffi-dev
```

## Ecosystem Status

### Good Support
- **Go-based tools**: esbuild (excellent)
- **Pure JS fallbacks**: Most serialization libraries

### Improving
- **Rust-based tools**: SWC, rollup (building works)
- **C/C++ modules**: Generally straightforward

### Challenging
- **Complex dependencies**: sharp (libvips ecosystem)
- **V8 internals**: isolated-vm

## Documentation Created

Full audit details available in:
- `/docs/NATIVE-DEPS-AUDIT.md` - Complete analysis with build instructions
- `/docs/BUILDING-SWC.md` - @next/swc build guide
- `/docs/SWC-WORKAROUNDS.md` - Workarounds and alternatives

## Next Steps

1. [ ] Test sharp WASM fallback performance
2. [ ] Document libvips build process for sharp
3. [ ] Consider creating prebuild hosting for common modules
4. [ ] Engage with lightningcss maintainers about riscv64 PR
5. [ ] Test Prisma JS-only mode on riscv64

## References

- esbuild: https://www.npmjs.com/package/@esbuild/linux-riscv64
- rollup: https://www.npmjs.com/package/@rollup/rollup-linux-riscv64-gnu
- sharp riscv64 issue: https://github.com/lovell/sharp/issues/4367
- sharp-libvips riscv64: https://github.com/lovell/sharp-libvips/issues/223
- lightningcss PR: https://github.com/parcel-bundler/lightningcss/pull/651

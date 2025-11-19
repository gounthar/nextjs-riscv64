# Next.js on riscv64

**Status: ✅ WORKING** - Both Pages Router and App Router fully functional with native SWC!

Run Next.js applications on riscv64 architecture with full SWC performance.

## Quick Start

### Prerequisites

- riscv64 hardware (tested on Banana Pi F3)
- Node.js v24.11.1+ from [nodejs-unofficial-builds](https://github.com/gounthar/unofficial-builds)
- Native SWC binaries (see [Building SWC](docs/BUILDING-SWC.md))

### Getting Started

1. **Create a Next.js project**:
   ```bash
   npx create-next-app@13.5.6 my-app
   cd my-app
   ```

2. **Install the riscv64 SWC package** (copy from your built binary):
   ```bash
   mkdir -p node_modules/@next/swc-linux-riscv64gc-gnu
   cp /path/to/next-swc.linux-riscv64gc-gnu.node \
      node_modules/@next/swc-linux-riscv64gc-gnu/
   echo '{"name":"@next/swc-linux-riscv64gc-gnu","version":"13.5.6","main":"next-swc.linux-riscv64gc-gnu.node"}' \
      > node_modules/@next/swc-linux-riscv64gc-gnu/package.json
   ```

3. **Apply the loader patch**:
   ```bash
   ./patches/apply-nextjs-patch.sh
   ```

4. **Build and run**:
   ```bash
   npm run build
   npm start
   ```

## What Works

| Feature | Status |
|---------|--------|
| **Pages Router** | ✅ Full support |
| **App Router** | ✅ Full support |
| SSG (Static Generation) | ✅ Working |
| SSR (Server-Side Rendering) | ✅ Working |
| API Routes | ✅ Working |
| TypeScript | ✅ Working |
| Production Builds | ✅ Working |
| Development Server | ✅ Working |

### Performance

- **Build time**: ~90 seconds on Banana Pi F3
- **Bundle sizes**: 79-87 kB (comparable to x64)
- **SWC performance**: Full native speed (17x faster than Babel)

## The Solution

Next.js requires a one-line patch to recognize riscv64 as a supported platform:

```javascript
// In node_modules/next/dist/build/swc/index.js
linux: {
    x64: linux.x64.filter((triple)=>triple.abi !== "gnux32"),
    arm64: linux.arm64,
    riscv64: linux.riscv64gc,  // ← Add this line
    arm: linux.arm
}
```

This maps Node.js's `riscv64` arch to the `riscv64gc` key in `@napi-rs/triples`.

### Why This Works

1. The `@napi-rs/triples` package already includes riscv64 definitions
2. Native SWC can be built for riscv64 (with `--no-default-features` to avoid ring v0.16.20)
3. The loader patch enables Next.js to find and load the native binary

## Documentation

- **[Building SWC](docs/BUILDING-SWC.md)** - Complete guide to building @next/swc from source
- **[SWC Workarounds](docs/SWC-WORKAROUNDS.md)** - All approaches including Babel fallback
- **[Patches](patches/README.md)** - Loader patch documentation and installer

## Repository Structure

```
nextjs-riscv64/
├── docs/
│   ├── BUILDING-SWC.md      # SWC build guide
│   └── SWC-WORKAROUNDS.md   # All workaround approaches
├── patches/
│   ├── apply-nextjs-patch.sh           # Automated installer
│   ├── nextjs-riscv64-support.patch    # The patch file
│   └── README.md                        # Patch documentation
├── scripts/
│   ├── install-nodejs.sh    # Node.js installer for riscv64
│   └── run-tests.sh         # Automated test runner
├── tests/
│   ├── pages-router/        # Pages Router test app
│   └── app-router/          # App Router test app
└── journal/                 # Session documentation
```

## Background

This project builds on [nodejs-unofficial-builds](https://github.com/gounthar/unofficial-builds), which provides Node.js binaries for riscv64. With Node.js available, the challenge was making Next.js work with its native SWC compiler.

**The Problem**: Next.js uses `@next/swc`, a Rust-based compiler with no prebuilt riscv64 binaries. Without them, builds fail with "unsupported platform" errors.

**The Solution**: Build SWC from source and patch the Next.js loader to recognize riscv64.

## Test Hardware

- **Platform**: Banana Pi F3 (riscv64)
- **OS**: Debian 13 (Trixie)
- **Node.js**: v24.11.1 from nodejs-unofficial-builds
- **Specs**: 8 cores, 15GB RAM

## Goals

1. ✅ **Runtime Testing**: Validate Next.js on riscv64 hardware
2. 🔄 **Dependency Audit**: Identify native modules needing support
3. 📋 **Prebuilt Binaries**: Create and host native modules
4. 📋 **Docker Images**: Provide turnkey development environments

## Alternative: Babel Fallback

For quick testing without building SWC, use Babel fallback (Pages Router only):

```bash
# Use Next.js 13.5.6
echo '{"presets":["next/babel"]}' > .babelrc
# Set swcMinify: false in next.config.js
npm run build
```

Note: Babel is 17x slower than native SWC and doesn't support App Router.

See [SWC Workarounds](docs/SWC-WORKAROUNDS.md) for details.

## Related Projects

- [nodejs-unofficial-builds](https://github.com/gounthar/unofficial-builds) - Node.js for riscv64
- [Next.js](https://github.com/vercel/next.js) - The React framework
- [SWC](https://github.com/swc-project/swc) - The Rust compiler

## Contributing

Issues track experimentation areas. Key issues:

- **#1**: Runtime Testing (✅ Complete)
- **#9**: ring crate workaround (✅ Solved)
- **#3**: Prebuilt Binaries Strategy
- **#7**: Upstream Engagement

## Long-term Vision

The goal is to make this repository unnecessary by getting riscv64 support into:
1. Official Next.js builds (@next/swc binaries)
2. Upstream Next.js loader code
3. Docker official images

Until then, this repo provides working solutions for the riscv64 community.

## License

MIT

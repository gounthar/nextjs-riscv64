# @next/swc Workarounds for riscv64

This document describes workarounds for the missing `@next/swc` native bindings on riscv64 architecture.

## The Problem

Next.js 12+ uses SWC (Speedy Web Compiler), a Rust-based compiler that's 17x faster than Babel. However, `@next/swc` doesn't provide prebuilt binaries for riscv64, causing builds to fail:

```
⚠ Trying to load next-swc for target triple [object Object],
but there next-swc does not have native bindings support

⨯ Failed to load SWC binary for linux/riscv64
Next.js build worker exited with code: 1
```

## Workaround 1: Babel Fallback (Recommended for Testing)

Next.js automatically falls back to Babel when it detects a custom Babel configuration.

### Steps

1. Create a `.babelrc` file in your project root:

```json
{
  "presets": ["next/babel"],
  "plugins": []
}
```

2. Run your build:

```bash
npm run build
```

Next.js will detect the `.babelrc` file and use Babel instead of SWC.

### Pros
- ✅ Works immediately without additional setup
- ✅ Fully compatible with Next.js features
- ✅ No code changes required

### Cons
- ❌ Significantly slower compilation (17x slower than SWC)
- ❌ Longer build times on riscv64 hardware
- ⚠️ Babel fallback being removed in Next.js v15

### When to Use

- Quick testing and validation
- Development environments
- Proof-of-concept deployments
- When build speed is not critical

## Workaround 2: Build @next/swc from Source (Long-term Solution)

Building `@next/swc` natively on riscv64 provides optimal performance.

### Prerequisites

- Rust toolchain for riscv64
- Build dependencies (see `@next/swc` build docs)
- Significant compilation time (~hours on Banana Pi F3)

### Steps

1. Clone the Next.js repository:

```bash
git clone https://github.com/vercel/next.js.git
cd next.js/packages/next-swc
```

2. Install Rust for riscv64:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add riscv64gc-unknown-linux-gnu
```

3. Build native module:

```bash
cargo build --release --target riscv64gc-unknown-linux-gnu
```

4. Copy built binary to your project:

```bash
cp target/riscv64gc-unknown-linux-gnu/release/next-swc.node \
   node_modules/@next/swc-linux-riscv64-gnu/
```

### Pros
- ✅ Full SWC performance (17x faster)
- ✅ Future-proof (works with Next.js v15+)
- ✅ Native platform optimization

### Cons
- ❌ Complex build process
- ❌ Long compilation times
- ❌ Requires Rust expertise
- ❌ Must rebuild for each Next.js version

### When to Use

- Production deployments
- Performance-critical applications
- Long-term riscv64 support strategy

## Workaround 3: Contribute to Upstream

Help get official riscv64 support in `@next/swc`.

### How to Help

1. **Open issue** in Next.js repository requesting riscv64 support
2. **Contribute CI/CD** for automated riscv64 builds
3. **Provide testing** on real riscv64 hardware
4. **Fund development** through GitHub Sponsors or bounties

### Links

- Next.js repository: https://github.com/vercel/next.js
- SWC project: https://github.com/swc-project/swc
- RISC-V software ports: https://wiki.riscv.org/display/HOME/Software+Ports

## Comparison

| Approach | Setup Time | Build Speed | Maintenance | Future-Proof |
|----------|------------|-------------|-------------|--------------|
| Babel Fallback | 1 minute | Slow (17x) | Low | ❌ (removed in v15) |
| Build from Source | Hours | Fast | High | ✅ |
| Upstream Support | Months | Fast | None | ✅ |

## Testing Results

### Pages Router with Babel Fallback

Status: **To be tested**

- [ ] Development mode works
- [ ] Production build succeeds
- [ ] SSG pages render correctly
- [ ] SSR pages work
- [ ] API routes function
- [ ] Build time acceptable

### App Router with Babel Fallback

Status: **To be tested**

- [ ] React Server Components work
- [ ] Client Components function
- [ ] Static rendering works
- [ ] Dynamic rendering works
- [ ] Route Handlers work
- [ ] Build time acceptable

## Recommendations

### For Development
Use **Babel fallback** - Quick setup, acceptable for development.

### For Production
Consider **building SWC from source** if:
- Build performance matters
- Deploying multiple applications
- Long-term riscv64 commitment

Otherwise, **Babel fallback** is acceptable for low-traffic production use.

### For Ecosystem
**Contribute upstream** - Help make this workaround unnecessary!

## Related Issues

- Issue #1: Runtime Testing
- Issue #2: Native Dependencies Audit
- Issue #3: Prebuilt Binaries Strategy

## Updates

- **2025-11-14**: Documented Babel fallback workaround
- **2025-11-14**: Created test .babelrc configurations
- **Next**: Test Babel fallback on Banana Pi F3

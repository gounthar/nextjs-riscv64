# Next.js riscv64 Patches

This directory contains patches required to make Next.js recognize and support riscv64 architecture.

## Overview

By default, Next.js 13.5.6 does not recognize riscv64 as a supported platform, even though:
1. The underlying `@napi-rs/triples` package includes riscv64 definitions
2. Native SWC binaries can be built for riscv64

This patch fixes the platform detection to enable native SWC support on riscv64.

## The Problem

Without this patch, Next.js shows:
```
⚠ Trying to load next-swc for unsupported platforms linux/riscv64
```

And falls back to WASM (which crashes on certain operations like App Router).

## The Solution

The patch modifies `getSupportedArchTriples()` in Next.js's SWC loader to include riscv64:

```javascript
linux: {
    x64: linux.x64.filter((triple)=>triple.abi !== "gnux32"),
    arm64: linux.arm64,
    riscv64: linux.riscv64gc,  // ← Added this line
    arm: linux.arm
}
```

**Note**: We map `riscv64` (Node.js arch name) to `riscv64gc` (the key in platformArchTriples).

## Files

- `nextjs-riscv64-support.patch` - Unified diff patch file
- `apply-nextjs-patch.sh` - Automated patch installer script
- `README.md` - This file

## Usage

### Automated Method (Recommended)

Run the patch installer from your Next.js project root:

```bash
cd ~/your-nextjs-project
/path/to/nextjs-riscv64/patches/apply-nextjs-patch.sh
```

The script will:
1. Verify you're in a Next.js project
2. Create a backup of the original file
3. Apply the patch
4. Verify the patch was applied correctly

### Manual Method

If you prefer to apply the patch manually:

```bash
cd ~/your-nextjs-project

# Create backup
cp node_modules/next/dist/build/swc/index.js{,.backup}

# Apply patch using sed
sed -i '/arm64: linux.arm64,/a\            riscv64: linux.riscv64gc,' \
    node_modules/next/dist/build/swc/index.js

# Verify
grep -A2 "arm64: linux.arm64" node_modules/next/dist/build/swc/index.js
```

Expected output:
```javascript
arm64: linux.arm64,
riscv64: linux.riscv64gc,
// This target is being deprecated...
```

## Verification

After applying the patch, run a Next.js build:

```bash
npm run build
```

**Success indicators**:
- ✅ No "unsupported platforms" warning
- ✅ "Compiled successfully" message appears
- ✅ Build completes without falling back to WASM

## Restoring Original Next.js

If you need to restore the unpatched version:

```bash
cp node_modules/next/dist/build/swc/index.js.backup \
   node_modules/next/dist/build/swc/index.js
```

## Prerequisites

Before applying this patch, ensure you have:

1. **riscv64 SWC binaries** installed as npm packages:
   - `@next/swc-linux-riscv64gc-gnu` (recommended)
   - OR `@next/swc-linux-riscv64-gnu`

2. **Node.js on riscv64**: v24.11.1+ from [nodejs-unofficial-builds](https://github.com/gounthar/unofficial-builds)

See the main repository README for instructions on building SWC binaries.

## Technical Details

### Why riscv64gc instead of riscv64?

The `@napi-rs/triples` package uses `riscv64gc` as the architecture key (standing for RISC-V 64-bit with G and C extensions - the standard base). However, Node.js's `process.arch` returns `riscv64`. This patch creates the necessary mapping.

### Patch Persistence

**Important**: This patch modifies `node_modules/`, so it will be **lost** when you:
- Run `npm install` or `npm ci`
- Delete `node_modules/` directory
- Deploy to a different environment

**Solutions**:
1. Add patch application to your `postinstall` script in `package.json`:
   ```json
   {
     "scripts": {
       "postinstall": "/path/to/patches/apply-nextjs-patch.sh"
     }
   }
   ```

2. Use [patch-package](https://www.npmjs.com/package/patch-package) for automatic patch management

3. Use a custom Docker image with pre-patched Next.js (planned for this project)

## Upstream Status

This is a temporary workaround. Long-term solutions:

1. **Ideal**: Get Vercel to publish official riscv64 binaries for `@next/swc`
2. **Better**: Contribute this patch upstream to Next.js
3. **Current**: Use this local patch until upstream support exists

## Related Issues

- **Issue #9**: ring crate compilation issues (requires `--no-default-features`)
- **PR #8**: Babel fallback workaround (pre-patch solution)

## Testing

This patch has been tested with:
- **Next.js**: 13.5.6
- **Node.js**: v24.11.1 (riscv64)
- **Platform**: Banana Pi F3 (Debian 13 Trixie)
- **Test apps**: Pages Router with SSG, SSR, and API routes

## License

Same as the main repository (MIT).

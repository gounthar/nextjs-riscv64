#!/bin/bash

# Apply Next.js riscv64 support patch
# This script patches Next.js to recognize riscv64 as a supported platform

set -euo pipefail

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from your Next.js project root."
    exit 1
fi

# Check if Next.js is installed
NEXTJS_SWC_FILE="node_modules/next/dist/build/swc/index.js"
if [ ! -f "$NEXTJS_SWC_FILE" ]; then
    echo "Error: Next.js not found in node_modules. Please run 'npm install' first."
    exit 1
fi

echo "=== Next.js riscv64 Patch Installer ==="
echo ""
echo "This will patch Next.js to support riscv64 architecture."
echo "Target file: $NEXTJS_SWC_FILE"
echo ""

# Create backup
echo "Creating backup..."
cp "$NEXTJS_SWC_FILE" "${NEXTJS_SWC_FILE}.backup"
echo "✅ Backup created: ${NEXTJS_SWC_FILE}.backup"
echo ""

# Apply patch
echo "Applying patch..."
if grep -q "riscv64: linux.riscv64gc" "$NEXTJS_SWC_FILE"; then
    echo "⚠️  Patch already applied!"
else
    # Add riscv64 support using unified diff patch
    PATCH_FILE="$(dirname "${BASH_SOURCE[0]}")/nextjs-riscv64-support.patch"
    if [ ! -f "$PATCH_FILE" ]; then
        echo "❌ Patch file not found: $PATCH_FILE"
        exit 1
    fi

    if patch -p1 < "$PATCH_FILE"; then
        echo "✅ Patch applied successfully"
    else
        echo "❌ Failed to apply patch"
        echo "Restoring backup..."
        mv "${NEXTJS_SWC_FILE}.backup" "${NEXTJS_SWC_FILE}"
        exit 1
    fi
fi

echo ""
echo "=== Verification ==="
if grep -q "riscv64: linux.riscv64gc" "$NEXTJS_SWC_FILE"; then
    echo "✅ riscv64 support verified in Next.js loader"
else
    echo "❌ Patch verification failed!"
    echo "Restoring backup..."
    mv "${NEXTJS_SWC_FILE}.backup" "${NEXTJS_SWC_FILE}"
    exit 1
fi

echo ""
echo "✅ All done! Next.js now supports riscv64 architecture."
echo ""
echo "To restore original Next.js:"
echo "  cp ${NEXTJS_SWC_FILE}.backup $NEXTJS_SWC_FILE"

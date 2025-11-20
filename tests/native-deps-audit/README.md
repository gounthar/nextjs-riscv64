# Native Dependencies Test Suite

Automated testing scripts for validating native Node.js modules on riscv64 architecture.

## Test Scripts

### 1. sharp-benchmark.js

Performance benchmarking tool comparing native libvips vs WASM implementations of Sharp image processing library.

**Prerequisites**:
```bash
# For native testing
SHARP_FORCE_GLOBAL_LIBVIPS=1 npm install sharp

# For WASM testing
npm install --cpu=wasm32 sharp
```

**Usage**:
```bash
# Test both implementations
node sharp-benchmark.js --implementation=both

# Test only native
node sharp-benchmark.js --implementation=native

# Test only WASM
node sharp-benchmark.js --implementation=wasm
```

**What it tests**:
- Image resizing (multiple sizes: 640x480 to 3840x2160)
- Format conversions (JPEG ↔ WebP, PNG ↔ JPEG)
- Image transformations (rotate, blur, grayscale)
- Composite operations

**Output**:
- Console output with performance metrics
- JSON results file: `sharp-benchmark-results-TIMESTAMP.json`
- Comparison tables and speedup ratios

**Expected Results**:
- Native typically 3-4x faster than WASM
- Larger images show bigger performance gaps
- Complex operations (blur, composite) benefit most from native

---

### 2. prisma-jsonly-test.js

Integration test for Prisma ORM using JavaScript-only mode (no Rust engines).

**Prerequisites**:
- Node.js 18+
- SQLite support (usually pre-installed)

**Usage**:
```bash
# Step 1: Set up test project
node prisma-jsonly-test.js setup

# Step 2: Run tests
node prisma-jsonly-test.js test

# Step 3: Clean up
node prisma-jsonly-test.js cleanup
```

**What it tests**:
- Prisma Client generation with `engineType: "client"`
- CRUD operations (Create, Read, Update, Delete)
- Relations between models
- Transaction handling
- Bulk operations performance

**Output**:
- Console output with test results
- JSON report: `prisma-test-project/test-report.json`
- SQLite database: `prisma-test-project/prisma/dev.db`

**Expected Results**:
- All operations work without Rust binaries
- Slightly slower than native engines but acceptable
- Full Prisma functionality available

---

## Running on Banana Pi F3

### Remote Execution

```bash
# Copy scripts to Banana Pi F3
scp -r tests/native-deps-audit poddingue@192.168.1.185:~/

# SSH into device
ssh poddingue@192.168.1.185

# Navigate to directory
cd ~/native-deps-audit

# Run tests
node sharp-benchmark.js --implementation=both
node prisma-jsonly-test.js setup
node prisma-jsonly-test.js test
```

### Automated Testing Script

Create a wrapper script for batch testing:

```bash
#!/bin/bash
# run-all-tests.sh

set -e

echo "================================"
echo "Native Dependencies Test Suite"
echo "================================"
echo ""

# System info
echo "System Information:"
echo "  Platform: $(uname -s)"
echo "  Architecture: $(uname -m)"
echo "  CPUs: $(nproc)"
echo "  Node.js: $(node --version)"
echo ""

# Test 1: Sharp benchmark
echo "Running Sharp benchmark..."
node sharp-benchmark.js --implementation=both
echo ""

# Test 2: Prisma setup and test
echo "Running Prisma tests..."
node prisma-jsonly-test.js setup
node prisma-jsonly-test.js test
node prisma-jsonly-test.js cleanup
echo ""

echo "================================"
echo "All tests complete!"
echo "================================"
```

---

## Interpreting Results

### Sharp Benchmark Results

**Performance Ratios**:
- `< 2x`: WASM is competitive, acceptable for some use cases
- `2-3x`: Native recommended for production
- `3-5x`: Strong case for native implementation
- `> 5x`: Native essential for performance-critical applications

**When to use WASM**:
- Development/testing environments
- Low-traffic sites
- Non-performance-critical image operations
- Deployment simplicity is priority

**When to use native**:
- Production workloads
- High-traffic sites
- Real-time image processing
- Batch processing large numbers of images

### Prisma Test Results

**Success Criteria**:
- ✅ Client generates without errors
- ✅ All CRUD operations pass
- ✅ Relations work correctly
- ✅ Performance acceptable (< 50ms per simple query)

**Known Limitations**:
- No Rust-powered query optimization
- Slightly higher memory usage
- No support for some advanced features (raw queries with params)

---

## Troubleshooting

### Sharp Benchmark Issues

**Error: "Cannot find libvips"**
```bash
# Install libvips
sudo apt-get install libvips-dev

# Or build from source (see docs/BUILDING-LIBVIPS.md)
```

**Error: "Native sharp not available"**
```bash
# Reinstall with global libvips
SHARP_FORCE_GLOBAL_LIBVIPS=1 npm install sharp
```

**WASM tests fail**
```bash
# Clean install WASM version
rm -rf node_modules/sharp
npm install --cpu=wasm32 sharp
```

### Prisma Test Issues

**Error: "Prisma Client not installed"**
```bash
# Rerun setup
node prisma-jsonly-test.js cleanup
node prisma-jsonly-test.js setup
```

**Error: "Database locked"**
```bash
# Remove SQLite database
rm -f prisma-test-project/prisma/dev.db
# Recreate
cd prisma-test-project
npx prisma migrate dev --name init
```

**Generate fails**
```bash
# Check Node.js version (need 18+)
node --version

# Update schema if needed
nano prisma-test-project/prisma/schema.prisma
```

---

## Contributing Results

When running tests on new hardware or configurations, please share results:

1. Run both test scripts
2. Collect output files
3. Note your hardware specs
4. Open an issue or PR with results

**Template**:
```
Hardware: [e.g., Banana Pi F3]
OS: [e.g., Debian 13]
Node.js: [e.g., v24.11.1]
Memory: [e.g., 15GB]

Sharp Results:
- Average speedup: 3.8x
- Recommendation: Native for production

Prisma Results:
- Status: All tests passed
- Average query time: 12ms
- Recommendation: JS-only mode is acceptable
```

---

## Related Documentation

- [BUILDING-LIBVIPS.md](../../docs/BUILDING-LIBVIPS.md) - Build libvips from source
- [NATIVE-DEPS-AUDIT.md](../../docs/NATIVE-DEPS-AUDIT.md) - Complete compatibility matrix
- [Issue #2](https://github.com/gounthar/nextjs-riscv64/issues/2) - Native dependencies audit

---

## Future Tests

Planned additions to this test suite:

- [ ] bcrypt performance benchmark (node vs bcryptjs)
- [ ] canvas rendering tests
- [ ] SQLite vs PostgreSQL performance comparison
- [ ] Memory usage profiling
- [ ] Long-running stability tests

---

**Last Updated**: 2025-11-20

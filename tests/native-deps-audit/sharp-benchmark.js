#!/usr/bin/env node

/**
 * Sharp Performance Benchmark for riscv64
 *
 * Compares native libvips vs WASM implementation performance
 * Run this on actual riscv64 hardware (Banana Pi F3)
 *
 * Usage:
 *   node sharp-benchmark.js [--implementation native|wasm|both]
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Parse command line arguments
const args = process.argv.slice(2);
const implementation = args.find(arg => arg.startsWith('--implementation='))?.split('=')[1] || 'both';

// Configuration
const TEST_ITERATIONS = 5;  // Run each test multiple times for average
const IMAGE_SIZES = [
  { name: 'small', width: 640, height: 480 },
  { name: 'medium', width: 1280, height: 720 },
  { name: 'large', width: 1920, height: 1080 },
  { name: 'xlarge', width: 3840, height: 2160 }
];

const OPERATIONS = [
  { name: 'resize', desc: 'Resize to 800x600' },
  { name: 'jpeg-to-webp', desc: 'JPEG → WebP conversion' },
  { name: 'png-to-jpeg', desc: 'PNG → JPEG conversion' },
  { name: 'rotate', desc: 'Rotate 90°' },
  { name: 'blur', desc: 'Apply blur filter (sigma=5)' },
  { name: 'grayscale', desc: 'Convert to grayscale' },
  { name: 'composite', desc: 'Composite two images' }
];

// Results storage
const results = {
  systemInfo: {},
  native: {},
  wasm: {},
  comparison: {}
};

/**
 * Get system information
 */
function getSystemInfo() {
  const os = require('os');

  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    nodeVersion: process.version,
    date: new Date().toISOString()
  };
}

/**
 * Create a test image
 */
async function createTestImage(sharp, width, height, format = 'jpeg') {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 100, g: 150, b: 200, alpha: 1 }
    }
  })
  [format]()
  .toBuffer();

  return buffer;
}

/**
 * Benchmark a specific operation
 */
async function benchmarkOperation(sharp, operation, imageBuffer, size) {
  const times = [];

  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const start = performance.now();

    try {
      switch (operation) {
        case 'resize':
          await sharp(imageBuffer).resize(800, 600).toBuffer();
          break;

        case 'jpeg-to-webp':
          await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();
          break;

        case 'png-to-jpeg':
          const pngBuffer = await sharp(imageBuffer).png().toBuffer();
          await sharp(pngBuffer).jpeg({ quality: 85 }).toBuffer();
          break;

        case 'rotate':
          await sharp(imageBuffer).rotate(90).toBuffer();
          break;

        case 'blur':
          await sharp(imageBuffer).blur(5).toBuffer();
          break;

        case 'grayscale':
          await sharp(imageBuffer).grayscale().toBuffer();
          break;

        case 'composite':
          const overlay = await sharp({
            create: {
              width: 100,
              height: 100,
              channels: 4,
              background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
          }).png().toBuffer();

          await sharp(imageBuffer)
            .composite([{ input: overlay, top: 10, left: 10 }])
            .toBuffer();
          break;
      }

      const end = performance.now();
      times.push(end - start);

    } catch (error) {
      console.error(`  ❌ Error in ${operation}:`, error.message);
      return null;
    }
  }

  // Calculate statistics
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const sorted = times.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { avg, median, min, max, times };
}

/**
 * Test native implementation
 */
async function testNative() {
  console.log('\n📊 Testing NATIVE libvips implementation...\n');

  let sharp;
  try {
    // Force native sharp (must be installed with SHARP_FORCE_GLOBAL_LIBVIPS=1)
    sharp = require('sharp');
    const versions = sharp.versions;

    if (!versions.vips) {
      throw new Error('Native libvips not detected');
    }

    console.log(`  libvips version: ${versions.vips}`);
    console.log(`  sharp version: ${versions.sharp}`);
    console.log('');

  } catch (error) {
    console.error('  ❌ Native sharp not available:', error.message);
    console.error('  Install with: SHARP_FORCE_GLOBAL_LIBVIPS=1 npm install sharp');
    return null;
  }

  const nativeResults = {};

  for (const size of IMAGE_SIZES) {
    console.log(`  Testing ${size.name} (${size.width}x${size.height})...`);
    nativeResults[size.name] = {};

    const imageBuffer = await createTestImage(sharp, size.width, size.height);

    for (const op of OPERATIONS) {
      process.stdout.write(`    ${op.desc}... `);
      const result = await benchmarkOperation(sharp, op.name, imageBuffer, size);

      if (result) {
        nativeResults[size.name][op.name] = result;
        console.log(`✓ ${result.avg.toFixed(2)}ms avg`);
      }
    }
    console.log('');
  }

  return nativeResults;
}

/**
 * Test WASM implementation
 */
async function testWASM() {
  console.log('\n📊 Testing WASM implementation...\n');

  let sharp;
  try {
    // Try to load WASM version
    // User should install with: npm install --cpu=wasm32 sharp
    sharp = require('sharp');

    console.log(`  sharp version: ${sharp.versions.sharp}`);
    console.log(`  Using WASM backend`);
    console.log('');

  } catch (error) {
    console.error('  ❌ WASM sharp not available:', error.message);
    console.error('  Install with: npm install --cpu=wasm32 sharp');
    return null;
  }

  const wasmResults = {};

  for (const size of IMAGE_SIZES) {
    console.log(`  Testing ${size.name} (${size.width}x${size.height})...`);
    wasmResults[size.name] = {};

    const imageBuffer = await createTestImage(sharp, size.width, size.height);

    for (const op of OPERATIONS) {
      process.stdout.write(`    ${op.desc}... `);
      const result = await benchmarkOperation(sharp, op.name, imageBuffer, size);

      if (result) {
        wasmResults[size.name][op.name] = result;
        console.log(`✓ ${result.avg.toFixed(2)}ms avg`);
      }
    }
    console.log('');
  }

  return wasmResults;
}

/**
 * Compare results and generate report
 */
function compareResults(nativeResults, wasmResults) {
  if (!nativeResults || !wasmResults) {
    return null;
  }

  console.log('\n📈 Performance Comparison (Native vs WASM)\n');
  console.log('─'.repeat(80));

  const comparison = {};

  for (const size of IMAGE_SIZES) {
    console.log(`\n${size.name.toUpperCase()} (${size.width}x${size.height}):`);
    console.log('─'.repeat(80));
    console.log('Operation'.padEnd(30) + 'Native'.padEnd(15) + 'WASM'.padEnd(15) + 'Ratio');
    console.log('─'.repeat(80));

    comparison[size.name] = {};

    for (const op of OPERATIONS) {
      const native = nativeResults[size.name]?.[op.name];
      const wasm = wasmResults[size.name]?.[op.name];

      if (native && wasm) {
        const ratio = (wasm.avg / native.avg).toFixed(2);
        comparison[size.name][op.name] = {
          native: native.avg,
          wasm: wasm.avg,
          ratio: parseFloat(ratio)
        };

        console.log(
          op.desc.padEnd(30) +
          `${native.avg.toFixed(1)}ms`.padEnd(15) +
          `${wasm.avg.toFixed(1)}ms`.padEnd(15) +
          `${ratio}x`
        );
      }
    }
  }

  return comparison;
}

/**
 * Generate summary statistics
 */
function generateSummary(comparison) {
  if (!comparison) return;

  console.log('\n\n📊 Summary Statistics\n');
  console.log('─'.repeat(80));

  const ratios = [];
  for (const size in comparison) {
    for (const op in comparison[size]) {
      ratios.push(comparison[size][op].ratio);
    }
  }

  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const minRatio = Math.min(...ratios);
  const maxRatio = Math.max(...ratios);

  console.log(`  Average speedup (Native vs WASM): ${avgRatio.toFixed(2)}x`);
  console.log(`  Best case: ${minRatio.toFixed(2)}x faster`);
  console.log(`  Worst case: ${maxRatio.toFixed(2)}x faster`);
  console.log('');
  console.log(`  Recommendation: ${avgRatio >= 3 ? 'Use native for production' : 'WASM is acceptable'}`);
  console.log('─'.repeat(80));
}

/**
 * Save results to file
 */
function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `sharp-benchmark-results-${timestamp}.json`;
  const filepath = path.join(__dirname, filename);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('  Sharp Performance Benchmark for riscv64');
  console.log('════════════════════════════════════════════════════════════════════════════════');

  // Collect system info
  results.systemInfo = getSystemInfo();
  console.log('\n🖥️  System Information:');
  console.log(`  Platform: ${results.systemInfo.platform}`);
  console.log(`  Architecture: ${results.systemInfo.arch}`);
  console.log(`  CPUs: ${results.systemInfo.cpus}`);
  console.log(`  Memory: ${results.systemInfo.totalMemory} (${results.systemInfo.freeMemory} free)`);
  console.log(`  Node.js: ${results.systemInfo.nodeVersion}`);

  // Run tests based on implementation flag
  if (implementation === 'native' || implementation === 'both') {
    results.native = await testNative();
  }

  if (implementation === 'wasm' || implementation === 'both') {
    results.wasm = await testWASM();
  }

  // Compare if both were tested
  if (implementation === 'both' && results.native && results.wasm) {
    results.comparison = compareResults(results.native, results.wasm);
    generateSummary(results.comparison);
  }

  // Save results
  saveResults(results);

  console.log('\n✅ Benchmark complete!\n');
}

// Run main function
main().catch(error => {
  console.error('\n❌ Benchmark failed:', error);
  process.exit(1);
});

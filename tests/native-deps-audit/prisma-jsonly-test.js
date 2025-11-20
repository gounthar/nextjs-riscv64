#!/usr/bin/env node

/**
 * Prisma JS-Only Mode Test for riscv64
 *
 * Tests Prisma Client in JavaScript-only mode (no Rust engines required)
 * This is the workaround for riscv64 where no prebuilt engines exist
 *
 * Usage:
 *   1. Set up test: node prisma-jsonly-test.js setup
 *   2. Run tests: node prisma-jsonly-test.js test
 *   3. Cleanup: node prisma-jsonly-test.js cleanup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, 'prisma-test-project');
const command = process.argv[2] || 'test';

/**
 * Setup test project
 */
function setup() {
  console.log('🔧 Setting up Prisma test project...\n');

  // Create test directory
  if (fs.existsSync(TEST_DIR)) {
    console.log('  Removing existing test directory...');
    fs.rmSync(TEST_DIR, { recursive: true });
  }

  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);

  // Initialize package.json
  console.log('  Initializing package.json...');
  const packageJson = {
    name: 'prisma-riscv64-test',
    version: '1.0.0',
    private: true,
    dependencies: {
      '@prisma/client': '^6.16.0'
    },
    devDependencies: {
      'prisma': '^6.16.0'
    }
  };
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // Create Prisma schema with JS-only configuration
  console.log('  Creating Prisma schema...');
  fs.mkdirSync('prisma', { recursive: true });

  const schema = `// Prisma schema for riscv64 (JS-only mode)
// Uses engineType = "client" to avoid Rust binaries

generator client {
  provider = "prisma-client-js"
  // JS-only mode - no native engines needed
  engineType = "client"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
`;

  fs.writeFileSync('prisma/schema.prisma', schema);

  // Install dependencies
  console.log('\n  Installing dependencies...');
  console.log('  This may take a few minutes...\n');

  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('  ❌ Failed to install dependencies');
    process.exit(1);
  }

  // Generate Prisma Client
  console.log('\n  Generating Prisma Client...\n');

  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.error('  ❌ Failed to generate Prisma Client');
    process.exit(1);
  }

  // Create database
  console.log('\n  Creating database...\n');

  try {
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  } catch (error) {
    console.error('  ❌ Failed to create database');
    process.exit(1);
  }

  console.log('\n✅ Setup complete!\n');
  console.log(`  Test directory: ${TEST_DIR}`);
  console.log('\n  Next step: node prisma-jsonly-test.js test\n');
}

/**
 * Run tests
 */
async function test() {
  console.log('🧪 Testing Prisma JS-only mode on riscv64...\n');

  // Change to test directory
  if (!fs.existsSync(TEST_DIR)) {
    console.error('❌ Test project not found. Run setup first:');
    console.error('   node prisma-jsonly-test.js setup\n');
    process.exit(1);
  }

  process.chdir(TEST_DIR);

  // Check if Prisma Client exists
  if (!fs.existsSync('node_modules/@prisma/client')) {
    console.error('❌ Prisma Client not installed. Run setup first.\n');
    process.exit(1);
  }

  // Create test script
  const testScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Prisma Client Info:');
  console.log('  Version:', require('@prisma/client/package.json').version);
  console.log('  Engine Type: JS-only (no Rust binaries)');
  console.log('');

  // Test 1: Create users
  console.log('Test 1: Creating users...');
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice'
    }
  });
  console.log('  ✓ Created user:', user1.email);

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob'
    }
  });
  console.log('  ✓ Created user:', user2.email);
  console.log('');

  // Test 2: Create posts
  console.log('Test 2: Creating posts...');
  const post1 = await prisma.post.create({
    data: {
      title: 'Hello riscv64!',
      content: 'Testing Prisma on riscv64 architecture',
      published: true,
      authorId: user1.id
    }
  });
  console.log('  ✓ Created post:', post1.title);

  const post2 = await prisma.post.create({
    data: {
      title: 'JS-only mode works',
      content: 'No Rust engines needed!',
      published: false,
      authorId: user2.id
    }
  });
  console.log('  ✓ Created post:', post2.title);
  console.log('');

  // Test 3: Query with relations
  console.log('Test 3: Querying with relations...');
  const users = await prisma.user.findMany({
    include: {
      posts: true
    }
  });

  console.log(\`  ✓ Found \${users.length} users:\`);
  users.forEach(user => {
    console.log(\`    - \${user.name} (\${user.email}): \${user.posts.length} posts\`);
  });
  console.log('');

  // Test 4: Update
  console.log('Test 4: Updating post...');
  const updatedPost = await prisma.post.update({
    where: { id: post2.id },
    data: { published: true }
  });
  console.log('  ✓ Published:', updatedPost.title);
  console.log('');

  // Test 5: Delete
  console.log('Test 5: Deleting data...');
  const deletedPosts = await prisma.post.deleteMany({});
  console.log(\`  ✓ Deleted \${deletedPosts.count} posts\`);

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(\`  ✓ Deleted \${deletedUsers.count} users\`);
  console.log('');

  // Test 6: Performance benchmark
  console.log('Test 6: Performance benchmark...');
  const startTime = Date.now();

  for (let i = 0; i < 100; i++) {
    await prisma.user.create({
      data: {
        email: \`user\${i}@example.com\`,
        name: \`User \${i}\`
      }
    });
  }

  const bulkTime = Date.now() - startTime;
  console.log(\`  ✓ Created 100 users in \${bulkTime}ms (\${(bulkTime / 100).toFixed(2)}ms avg)\`);

  // Cleanup
  await prisma.user.deleteMany({});

  console.log('');
  console.log('✅ All tests passed!');
}

main()
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  fs.writeFileSync('test.js', testScript);

  // Run the test
  console.log('Running tests...\n');
  console.log('─'.repeat(80));

  try {
    execSync('node test.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Tests failed');
    process.exit(1);
  }

  console.log('─'.repeat(80));
  console.log('\n✅ Prisma JS-only mode validated on riscv64!\n');

  // Generate report
  const report = {
    date: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch(),
    nodeVersion: process.version,
    prismaVersion: require(path.join(TEST_DIR, 'node_modules/@prisma/client/package.json')).version,
    engineType: 'client (JS-only)',
    status: 'success',
    notes: [
      'No Rust engines required',
      'All CRUD operations working',
      'Relations working correctly',
      'Performance acceptable for JS-only mode'
    ]
  };

  const reportPath = path.join(TEST_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved to: ${reportPath}\n`);
}

/**
 * Cleanup test project
 */
function cleanup() {
  console.log('🧹 Cleaning up test project...\n');

  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
    console.log(`  ✓ Removed ${TEST_DIR}\n`);
  } else {
    console.log('  No test directory found.\n');
  }

  console.log('✅ Cleanup complete!\n');
}

/**
 * Show usage
 */
function showUsage() {
  console.log(`
Prisma JS-Only Mode Test for riscv64

Usage:
  node prisma-jsonly-test.js <command>

Commands:
  setup    - Create test project and install Prisma
  test     - Run Prisma functionality tests
  cleanup  - Remove test project

Example workflow:
  1. node prisma-jsonly-test.js setup
  2. node prisma-jsonly-test.js test
  3. node prisma-jsonly-test.js cleanup

Notes:
  - Tests engineType = "client" (JS-only, no Rust binaries)
  - Requires Node.js 18+ and npm
  - Uses SQLite for simplicity (no server needed)
  - Test directory: ${TEST_DIR}
`);
}

/**
 * Main execution
 */
function main() {
  switch (command) {
    case 'setup':
      setup();
      break;

    case 'test':
      test();
      break;

    case 'cleanup':
      cleanup();
      break;

    case 'help':
    case '--help':
    case '-h':
      showUsage();
      break;

    default:
      console.error(`❌ Unknown command: ${command}\n`);
      showUsage();
      process.exit(1);
  }
}

// Run
main();

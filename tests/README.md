# Next.js Test Applications

This directory contains test applications for validating Next.js on riscv64 architecture.

## Test Structure

### pages-router/
Basic Next.js application using the Pages Router (traditional routing).

**Features tested:**
- Basic page rendering
- API routes
- Static generation (SSG)
- Server-side rendering (SSR)
- Client-side navigation

### app-router/
Next.js application using the App Router (Next.js 13+).

**Features tested:**
- React Server Components
- Streaming
- Server actions
- Layouts and nested routes
- Loading states

## Running Tests

### On riscv64 Hardware (Banana Pi F3)

1. Install Node.js riscv64 binary:
```bash
# See scripts/install-nodejs.sh
```

2. Test Pages Router app:
```bash
cd tests/pages-router
npm install
npm run dev     # Development mode
npm run build   # Production build
npm run start   # Production server
```

3. Test App Router app:
```bash
cd tests/app-router
npm install
npm run dev     # Development mode
npm run build   # Production build
npm run start   # Production server
```

## Test Scenarios

### Development Mode Tests
- Hot reload functionality
- Error overlay
- Fast refresh
- Console logging

### Production Build Tests
- Build time measurement
- Build output size
- Static optimization
- Prerendering

### Production Server Tests
- Server startup time
- Response times
- Memory usage
- Concurrent requests

## Results

Test results are documented in `docs/testing/`.

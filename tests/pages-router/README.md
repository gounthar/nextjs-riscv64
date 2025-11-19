# Next.js Pages Router Test App

This is a test application for validating Next.js Pages Router on riscv64 architecture.

## Features

- **Home Page** (`/`) - Landing page with navigation
- **About Page** (`/about`) - Static about page
- **SSG Test** (`/ssg`) - Static Site Generation with `getStaticProps`
- **SSR Test** (`/ssr`) - Server-Side Rendering with `getServerSideProps`
- **API Test** (`/api-test`) - Client-side API call testing
- **API Route** (`/api/test`) - Server-side API endpoint

## Setup

### 1. Install Node.js riscv64

```bash
# Run the installation script from the repository root
../../scripts/install-nodejs.sh
```

### 2. Install Dependencies

```bash
npm install
```

## Running Tests

### Development Mode

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

**What to test:**
- Hot Module Replacement (HMR) - Edit a file and see changes instantly
- Fast Refresh - React state should be preserved during edits
- Error overlay - Introduce a syntax error and check the error display

### Production Build

```bash
npm run build
```

**What to observe:**
- Build time on riscv64 hardware
- Build output size
- Static page optimization
- Any build errors or warnings

### Production Server

```bash
npm run start
```

**What to test:**
- Server startup time
- Page load performance
- SSR functionality
- API routes

## Expected Results

### Working Features
✅ All pages should render correctly
✅ Client-side navigation should work
✅ SSG pages should be pre-rendered at build time
✅ SSR pages should render on each request
✅ API routes should respond correctly

### Known Issues

Document any issues encountered here:

- [ ] Issue 1: Description
- [ ] Issue 2: Description

## Performance Metrics

Record performance metrics on Banana Pi F3:

- **Build Time**: ___ minutes
- **Build Output Size**: ___ MB
- **Dev Server Startup**: ___ seconds
- **Production Server Startup**: ___ seconds
- **Average Response Time**: ___ ms

## System Information

- **Hardware**: Banana Pi F3
- **Architecture**: riscv64
- **OS**: Debian 13 (Trixie)
- **Node.js Version**: ___
- **Next.js Version**: 14.2.0

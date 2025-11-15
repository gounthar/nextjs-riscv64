# Next.js App Router Test App

This is a test application for validating Next.js App Router on riscv64 architecture.

## Features

- **Home Page** (`/`) - Landing page with navigation (Server Component)
- **About Page** (`/about`) - Static about page (Server Component)
- **SSG Test** (`/ssg`) - Static rendering with React Server Components
- **Dynamic Test** (`/ssr`) - Dynamic rendering on each request
- **API Test** (`/api-test`) - Client-side API call testing (Client Component)
- **API Route** (`/api/test`) - App Router API endpoint

## App Router Features Tested

- ✅ React Server Components (RSC)
- ✅ File-based routing in `app/` directory
- ✅ Layouts and nested routes
- ✅ Static rendering (`force-static`)
- ✅ Dynamic rendering (`force-dynamic`)
- ✅ Client Components (`'use client'`)
- ✅ API Routes (Route Handlers)
- ✅ TypeScript support

## Version Pinning Strategy

This test application uses an **exact version pin** for Next.js (`13.5.6`) rather than a semver range (e.g., `~13.5.6` or `^13.5.6`). This is intentional and serves different purposes depending on the use case:

### For Experimental Testing (Current Approach)
- **Version**: `"next": "13.5.6"` (exact pin)
- **Purpose**: Ensures reproducibility of test results across different environments and time periods
- **Benefits**: 
  - Consistent behavior when debugging issues
  - Reliable comparisons between test runs
  - Clear documentation of tested configurations
- **Use When**: Running experiments, validating workarounds, or documenting specific behaviors

### For Production Use (Recommended)
- **Version**: `"next": "~13.5.6"` (tilde range)
- **Purpose**: Allows automatic patch updates (e.g., 13.5.7, 13.5.8) while preventing minor version changes
- **Benefits**:
  - Automatic security patches
  - Bug fixes without manual updates
  - Still maintains API compatibility (no breaking changes)
- **Use When**: Deploying to production, maintaining applications over time

**Note**: The tilde (`~`) constraint allows patch-level updates only. For example, `~13.5.6` matches `13.5.6`, `13.5.7`, `13.5.99`, but not `13.6.0` or `14.0.0`.

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
- Hot Module Replacement (HMR) with React Server Components
- Fast Refresh for both Server and Client Components
- Error overlay
- Development performance

### Production Build

```bash
npm run build
```

**What to observe:**
- Build time on riscv64 hardware
- Build output size
- Static page optimization
- Route prerendering
- Any build errors or warnings

### Production Server

```bash
npm run start
```

**What to test:**
- Server startup time
- Page load performance
- Dynamic rendering
- API routes

## Expected Results

### Working Features
✅ All pages should render correctly
✅ Client-side navigation should work seamlessly
✅ Server Components should execute on the server
✅ Client Components should work with interactivity
✅ Static routes should be pre-rendered at build time
✅ Dynamic routes should render on each request
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
- **Average Response Time (SSG)**: ___ ms
- **Average Response Time (Dynamic)**: ___ ms

## System Information

- **Hardware**: Banana Pi F3
- **Architecture**: riscv64
- **OS**: Debian 13 (Trixie)
- **Node.js Version**: ___
- **Next.js Version**: 14.2.0
- **React Version**: 18.3.0

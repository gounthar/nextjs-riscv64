# Prebuild Hosting Strategy for riscv64 Binaries

Comprehensive strategy for hosting, distributing, and managing prebuilt native Node.js module binaries for riscv64 architecture.

**Last Updated**: 2025-11-20

## Executive Summary

This document outlines multiple distribution strategies for riscv64 prebuilt binaries, each serving different use cases and audiences. A hybrid approach is recommended to maximize reach and ease of adoption.

### Quick Reference

| Strategy | Audience | Complexity | Maintenance | Best For |
|----------|----------|------------|-------------|----------|
| GitHub Releases | Developers | Low | Low | Quick start, manual installation |
| npm Scoped Packages | Node.js developers | Medium | Medium | Seamless npm integration |
| System Packages | System admins | High | High | OS-level integration |
| Docker Images | DevOps teams | Medium | Medium | Containerized workflows |
| Custom Registry | Enterprise | High | High | Private/internal use |

## Distribution Strategies

### Strategy 1: GitHub Releases (CURRENT)

**Status**: ✅ Implemented for @next/swc

**How it works**:
1. Build binaries on riscv64 hardware
2. Create GitHub release with semantic version tag
3. Upload binary artifacts with SHA256 checksums
4. Provide installation scripts

**Pros**:
- ✅ Simple to implement and maintain
- ✅ No additional infrastructure needed
- ✅ Free hosting with generous bandwidth
- ✅ Version control with git tags
- ✅ Automated with GitHub Actions

**Cons**:
- ❌ Manual installation required
- ❌ No automatic discovery by npm
- ❌ Users must run custom scripts
- ❌ Not integrated with package managers

**Implementation**:
```bash
# Example: @next/swc release
gh release create v13.5.6-riscv64-1 \
  --title "@next/swc for riscv64 - Next.js 13.5.6" \
  --notes "Native SWC binaries for riscv64 architecture" \
  next-swc.linux-riscv64gc-gnu.node \
  SHA256SUMS
```

**Current Usage**:
- Release: `v13.5.6-riscv64-1`
- Script: `scripts/install-riscv64-binaries.sh`
- Downloads: ~50-100/month (estimated)

**Recommended For**:
- Initial releases and testing
- Low-volume distribution
- Developer audience comfortable with scripts

---

### Strategy 2: npm Scoped Packages (RECOMMENDED)

**Status**: 🔄 Planned

**How it works**:
1. Create scoped npm packages: `@riscv64/package-name`
2. Publish prebuilt binaries to npm registry
3. Users install with standard npm commands
4. Optionally use postinstall scripts for integration

**Pros**:
- ✅ Seamless npm integration
- ✅ Automatic version management
- ✅ Works with all npm tools (lock files, workspaces)
- ✅ Discoverable via npm search
- ✅ Familiar workflow for developers

**Cons**:
- ❌ Requires npm account and publishing rights
- ❌ Package naming conventions needed
- ❌ Must maintain for each module version
- ❌ Limited to npm ecosystem

**Package Naming Convention**:
```
@riscv64/next-swc-13       # Version-specific
@riscv64/next-swc          # Latest version
@riscv64/sharp             # Image processing
@riscv64/bcrypt            # Cryptography
@riscv64/better-sqlite3    # Database
```

**Installation Example**:
```bash
# Install scoped package
npm install @riscv64/next-swc-13

# Automatic discovery
npm install next@13.5.6  # Detects @riscv64/next-swc-13 automatically
```

**Implementation Steps**:
1. Register npm organization: `@riscv64`
2. Create package structure with binaries
3. Automate publishing with CI/CD
4. Document installation process
5. Set up deprecation policy

**Cost**: Free (npm public packages)

**Maintenance Effort**: Medium (automated publishing, version tracking)

**Recommended For**:
- Production deployments
- npm-centric workflows
- Wide distribution

---

### Strategy 3: System Packages (.deb/.rpm)

**Status**: 🔄 Planned (Issue #21)

**How it works**:
1. Package binaries as Debian/Fedora packages
2. Host in custom APT/YUM repositories
3. Users install via `apt`/`dnf` package managers
4. System-wide installation and updates

**Pros**:
- ✅ OS-level integration
- ✅ Automatic dependency resolution
- ✅ System-wide availability
- ✅ Familiar to system administrators
- ✅ Integrated with OS security updates

**Cons**:
- ❌ Complex packaging requirements
- ❌ Separate packages for each distro
- ❌ Repository hosting infrastructure needed
- ❌ GPG signing and key management
- ❌ High maintenance overhead

**Package Structure**:
```
Debian (.deb):
  nextjs-swc-riscv64_13.5.6-1_riscv64.deb
  nextjs-swc-riscv64_14.2.32-1_riscv64.deb

Fedora (.rpm):
  nextjs-swc-riscv64-13.5.6-1.fc38.riscv64.rpm
  nextjs-swc-riscv64-14.2.32-1.fc39.riscv64.rpm
```

**Repository Hosting Options**:
- Launchpad PPA (Debian/Ubuntu)
- Fedora COPR (Fedora/RHEL)
- GitHub Pages (custom repo)
- Cloudflare R2/S3 (custom repo)

**Installation Example**:
```bash
# Debian/Ubuntu
echo "deb [trusted=yes] https://gounthar.github.io/riscv64-repo debian main" | \
  sudo tee /etc/apt/sources.list.d/riscv64.list
sudo apt update
sudo apt install nextjs-swc-riscv64

# Fedora
sudo dnf copr enable gounthar/riscv64-binaries
sudo dnf install nextjs-swc-riscv64
```

**Implementation Timeline**: 2-3 months (see Issue #21)

**Recommended For**:
- Enterprise deployments
- System administrators
- CI/CD pipelines
- Long-term production systems

---

### Strategy 4: Docker Images

**Status**: 🔄 Planned (Issue #4)

**How it works**:
1. Create Docker images with prebuilt binaries
2. Publish to Docker Hub or GitHub Container Registry
3. Users pull and run containers
4. Optional: Base images for custom builds

**Pros**:
- ✅ Complete environment packaging
- ✅ Consistent across platforms
- ✅ Easy to distribute and deploy
- ✅ Includes all dependencies
- ✅ Popular in DevOps workflows

**Cons**:
- ❌ Larger download size
- ❌ Container overhead
- ❌ Learning curve for Docker
- ❌ Not suitable for bare-metal deployments

**Image Variants**:
```
gounthar/nextjs-riscv64:13.5.6-base       # Minimal Node.js + SWC
gounthar/nextjs-riscv64:13.5.6-dev        # Development tools
gounthar/nextjs-riscv64:13.5.6-prod       # Production optimized
gounthar/nextjs-riscv64:13.5.6-full       # All native modules
```

**Usage Example**:
```bash
# Run development server
docker run -p 3000:3000 -v $(pwd):/app \
  gounthar/nextjs-riscv64:13.5.6-dev

# Production build
docker run -v $(pwd):/app \
  gounthar/nextjs-riscv64:13.5.6-prod \
  npm run build
```

**Implementation Timeline**: 1-2 months (see Issue #4)

**Recommended For**:
- Containerized deployments
- Kubernetes/orchestration
- CI/CD pipelines
- Development environments

---

### Strategy 5: Custom npm Registry

**Status**: ⏳ Future consideration

**How it works**:
1. Set up private npm registry (Verdaccio, npm Enterprise)
2. Host prebuilt packages
3. Users configure `.npmrc` to use custom registry
4. Fallback to public npm for other packages

**Pros**:
- ✅ Full control over distribution
- ✅ Can proxy public npm
- ✅ Works with existing npm tools
- ✅ Support for private packages
- ✅ Caching and bandwidth control

**Cons**:
- ❌ Infrastructure and hosting costs
- ❌ Maintenance overhead
- ❌ Requires user configuration
- ❌ Not discoverable without documentation

**Configuration Example**:
```bash
# .npmrc
@riscv64:registry=https://npm.riscv64.dev/
@next:registry=https://npm.riscv64.dev/
```

**Cost**: $50-200/month (hosting + bandwidth)

**Recommended For**:
- Enterprise deployments
- Private/internal use
- High-volume distribution
- Custom package modifications

---

## Recommended Hybrid Approach

Based on different user needs, implement a multi-tier strategy:

### Phase 1: Foundation (Q1 2026)
1. **GitHub Releases** - Continue for initial releases
2. **Installation Scripts** - Automated setup scripts

### Phase 2: npm Integration (Q2 2026)
3. **npm Scoped Packages** - `@riscv64/*` namespace
4. **Automated Publishing** - CI/CD for releases

### Phase 3: System Integration (Q3-Q4 2026)
5. **Debian Packages** - APT repository
6. **Fedora Packages** - COPR hosting
7. **Docker Images** - Container distribution

### Phase 4: Enterprise (2027+)
8. **Custom Registry** - Optional for enterprise users
9. **Mirror Network** - Geographic distribution

---

## Package Prioritization

### Tier 1: Critical (Immediate)
- **@next/swc** - Core Next.js functionality
- **sharp** - Image processing (if no official support)

### Tier 2: Common (3-6 months)
- **bcrypt** - Authentication
- **better-sqlite3** - Database
- **canvas** - Graphics

### Tier 3: Optional (6-12 months)
- **argon2** - Advanced crypto
- **msgpackr** - Serialization
- **keytar** - Credentials storage

---

## Automation Strategy

### Build Automation

```yaml
# .github/workflows/build-release.yml
name: Build and Release riscv64 Binaries

on:
  push:
    tags:
      - 'v*-riscv64-*'

jobs:
  build:
    runs-on: [self-hosted, riscv64]  # Banana Pi F3
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build binary
        run: ./scripts/build-native.sh

      - name: Generate checksums
        run: sha256sum *.node > SHA256SUMS

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            *.node
            SHA256SUMS

      - name: Publish to npm
        if: contains(github.ref, '-npm')
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Publishing Workflow

1. **Trigger**: New release tag (`v13.5.6-riscv64-1`)
2. **Build**: Compile on riscv64 hardware
3. **Test**: Run integration tests
4. **Package**: Create distributable artifacts
5. **Publish**:
   - GitHub Release
   - npm package (if ready)
   - Update documentation
6. **Notify**: Announce on project channels

---

## Versioning Strategy

### Semantic Versioning

Format: `<upstream-version>-riscv64-<revision>`

Examples:
- `13.5.6-riscv64-1` - First riscv64 build of Next.js 13.5.6
- `13.5.6-riscv64-2` - Second build (bug fix or rebuild)
- `14.2.32-riscv64-1` - First build of Next.js 14.2.32

### npm Package Versioning

```json
{
  "name": "@riscv64/next-swc",
  "version": "13.5.6-riscv64.1",
  "description": "Next.js SWC compiler for riscv64"
}
```

### Deprecation Policy

- Support latest 2 major versions
- Security fixes for previous major version
- Clear migration paths documented
- 6-month deprecation notice

---

## Cost Analysis

### GitHub Releases (Current)
- **Cost**: $0/month
- **Bandwidth**: Unlimited (GitHub)
- **Storage**: Unlimited (reasonable use)
- **Maintenance**: 2-4 hours/month

### npm Scoped Packages
- **Cost**: $0/month (public packages)
- **Bandwidth**: Unlimited (npm CDN)
- **Storage**: Unlimited (npm)
- **Maintenance**: 4-6 hours/month (automation)

### System Packages
- **Cost**: $0-50/month (hosting)
- **Bandwidth**: Variable
- **Storage**: 10-50GB
- **Maintenance**: 8-12 hours/month

### Docker Images
- **Cost**: $0-20/month (Docker Hub free tier)
- **Bandwidth**: Generous free tier
- **Storage**: 1-5GB per image
- **Maintenance**: 4-8 hours/month

### Total Hybrid Approach
- **Initial Setup**: 40-60 hours
- **Monthly Cost**: $0-70
- **Monthly Maintenance**: 10-20 hours
- **Ongoing Automation**: Reduces to 5-10 hours/month

---

## Success Metrics

### Adoption Metrics
- Downloads per month
- Unique users/IPs
- npm package install count
- Docker image pulls
- System package installations

### Performance Metrics
- Build success rate
- Installation failure rate
- Time to availability (release → publish)
- User-reported issues

### Community Metrics
- GitHub stars/forks
- Issue activity
- PR contributions
- Documentation visits

### Target Goals (12 months)
- 500+ monthly downloads
- < 5% installation failure rate
- < 24h release-to-publish time
- 50+ community stars

---

## Security Considerations

### Binary Signing
- GPG sign all releases
- Publish public key
- Document verification process

### Checksum Verification
- SHA256 for all binaries
- Automated verification in scripts
- Fail-safe on mismatch

### Supply Chain Security
- Reproducible builds
- Build provenance (SLSA)
- Dependency pinning
- Security scanning

### Access Control
- Limited publish access
- 2FA required
- Audit logging
- Regular access reviews

---

## Migration Paths

### From Manual Installation
```bash
# Old way
curl -L https://github.com/.../releases/download/... | tar xz
# New way
npm install @riscv64/next-swc
```

### From GitHub Releases
```bash
# Old way
./install-riscv64-binaries.sh
# New way
npm install @riscv64/next-swc
```

### From npm to System Packages
```bash
# Old way
npm install @riscv64/next-swc
# New way
sudo apt install nextjs-swc-riscv64
```

---

## Related Documentation

- [Issue #3](https://github.com/gounthar/nextjs-riscv64/issues/3) - Prebuilt Binaries Strategy
- [Issue #21](https://github.com/gounthar/nextjs-riscv64/issues/21) - Debian/Fedora Packaging
- [Issue #4](https://github.com/gounthar/nextjs-riscv64/issues/4) - Docker Images
- [PREBUILT-BINARIES-STRATEGY.md](PREBUILT-BINARIES-STRATEGY.md) - Original strategy document

---

## Next Steps

1. **Immediate** (This month):
   - Register @riscv64 npm organization
   - Set up npm publishing workflow
   - Publish @next/swc as first scoped package

2. **Short-term** (1-3 months):
   - Automate GitHub → npm publishing
   - Add 2-3 more critical packages
   - Document migration paths

3. **Medium-term** (3-6 months):
   - Begin Debian packaging work
   - Create Docker base images
   - Establish maintenance routines

4. **Long-term** (6-12 months):
   - Complete system package distribution
   - Expand to 10+ packages
   - Consider custom registry for enterprise

---

**Summary**: A hybrid distribution strategy maximizes reach while maintaining manageable maintenance overhead. Start with GitHub Releases + npm scoped packages, then expand to system packages and Docker as demand grows.

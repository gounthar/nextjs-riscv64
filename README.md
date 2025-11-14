# Next.js on riscv64

Experimental support for running Next.js applications on riscv64 architecture.

## Background

This project builds on the work from [nodejs-unofficial-builds](https://github.com/nodejs/unofficial-builds), which provides Node.js binaries for riscv64. With Node.js now available for riscv64, the next frontier is ensuring the entire JavaScript ecosystem works seamlessly on this architecture.

Next.js is one of the most popular React frameworks, but it has dependencies with native bindings (notably `@next/swc`) that may not have prebuilt binaries for riscv64. This repository explores various approaches to make Next.js fully functional on riscv64.

## Goals

1. **Runtime Testing**: Validate Next.js applications on riscv64 hardware
2. **Dependency Audit**: Identify native modules that need compilation support
3. **Prebuilt Binaries**: Create platform-specific packages when needed
4. **Developer Experience**: Provide tooling (Docker images, scripts) for riscv64 development

## Test Hardware

- **Platform**: Banana Pi F3 (riscv64)
- **OS**: Debian 13 (Trixie)
- **Node.js**: Built from [nodejs-unofficial-builds](https://github.com/nodejs/unofficial-builds)
- **Specs**: 8 cores, 15GB RAM, gcc 14.2.0

## Status

This is an experimental project exploring Next.js compatibility on riscv64. Issues track individual experimentation areas.

## Contributing

This is a private repository for experimentation. Results and findings will be documented as issues are completed.

## Related Projects

- [nodejs-unofficial-builds](https://github.com/nodejs/unofficial-builds) - Node.js binaries for riscv64
- [Next.js](https://github.com/vercel/next.js) - The React framework

## License

TBD

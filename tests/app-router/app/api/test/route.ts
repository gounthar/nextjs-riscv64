import { NextResponse } from 'next/server'

export async function GET() {
  const memUsage = process.memoryUsage()

  return NextResponse.json({
    message: 'API route working on riscv64!',
    timestamp: new Date().toISOString(),
    serverInfo: {
      arch: process.arch,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
    },
  })
}

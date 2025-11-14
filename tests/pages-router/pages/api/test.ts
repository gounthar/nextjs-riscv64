import type { NextApiRequest, NextApiResponse } from 'next'

interface ResponseData {
  message: string
  timestamp: string
  serverInfo: {
    arch: string
    nodeVersion: string
    platform: string
    uptime: number
    memory: {
      used: string
      total: string
    }
  }
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const memUsage = process.memoryUsage()

  res.status(200).json({
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

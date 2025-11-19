import Link from 'next/link'

// This page is dynamically rendered for each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getServerInfo() {
  return {
    timestamp: new Date().toISOString(),
    requestTime: new Date().toISOString(),
    serverInfo: {
      arch: process.arch,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
    },
  }
}

export default async function DynamicTest() {
  const { timestamp, requestTime, serverInfo } = await getServerInfo()

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">Dynamic Rendering Test</h1>

        <div className="description">
          <p>
            This page is dynamically rendered on each request using React Server Components.
          </p>

          <h2>Request Information</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Page Load Time:</strong></td>
                <td>{timestamp}</td>
              </tr>
              <tr>
                <td><strong>Server Render Time:</strong></td>
                <td>{requestTime}</td>
              </tr>
              <tr>
                <td><strong>Architecture:</strong></td>
                <td>{serverInfo.arch}</td>
              </tr>
              <tr>
                <td><strong>Node.js Version:</strong></td>
                <td>{serverInfo.nodeVersion}</td>
              </tr>
              <tr>
                <td><strong>Platform:</strong></td>
                <td>{serverInfo.platform}</td>
              </tr>
              <tr>
                <td><strong>Process Uptime:</strong></td>
                <td>{serverInfo.uptime}s</td>
              </tr>
            </tbody>
          </table>

          <p className="note">
            ✅ If you see a fresh timestamp each time you reload, dynamic rendering is working!
          </p>
        </div>

        <Link href="/" className="backLink">
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

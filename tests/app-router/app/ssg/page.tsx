import Link from 'next/link'

// This page is statically rendered at build time
export const dynamic = 'force-static'

async function getBuildInfo() {
  return {
    timestamp: new Date().toISOString(),
    buildInfo: {
      arch: process.arch,
      nodeVersion: process.version,
      platform: process.platform,
    },
  }
}

export default async function SSGTest() {
  const { timestamp, buildInfo } = await getBuildInfo()

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">Static Rendering Test</h1>

        <div className="description">
          <p>
            This page is statically rendered at build time using React Server Components.
          </p>

          <h2>Build Information</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Build Timestamp:</strong></td>
                <td>{timestamp}</td>
              </tr>
              <tr>
                <td><strong>Architecture:</strong></td>
                <td>{buildInfo.arch}</td>
              </tr>
              <tr>
                <td><strong>Node.js Version:</strong></td>
                <td>{buildInfo.nodeVersion}</td>
              </tr>
              <tr>
                <td><strong>Platform:</strong></td>
                <td>{buildInfo.platform}</td>
              </tr>
            </tbody>
          </table>

          <p className="note">
            ✅ If you see this page, static rendering is working correctly on riscv64!
          </p>
        </div>

        <Link href="/" className="backLink">
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

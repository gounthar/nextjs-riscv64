import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

interface Props {
  timestamp: string
  requestTime: string
  serverInfo: {
    arch: string
    nodeVersion: string
    platform: string
    uptime: number
  }
}

const SSRTest: NextPage<Props> = ({ timestamp, requestTime, serverInfo }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>SSR Test - Next.js on riscv64</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Server-Side Rendering (SSR) Test</h1>

        <div className={styles.description}>
          <p>
            This page is rendered on the server for each request using <code>getServerSideProps</code>.
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
                <td>{Math.floor(serverInfo.uptime)}s</td>
              </tr>
            </tbody>
          </table>

          <p className={styles.note}>
            ✅ If you see a fresh timestamp each time you reload, SSR is working correctly!
          </p>

          <button
            onClick={() => window.location.reload()}
            className={styles.button}
          >
            Reload Page
          </button>
        </div>

        <Link href="/" className={styles.backLink}>
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const requestTime = new Date().toISOString()

  return {
    props: {
      timestamp: new Date().toISOString(),
      requestTime,
      serverInfo: {
        arch: process.arch,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    },
  }
}

export default SSRTest

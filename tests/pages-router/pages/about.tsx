import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

const About: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>About - Next.js on riscv64</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>About This Test</h1>

        <div className={styles.description}>
          <p>
            This application tests Next.js Pages Router functionality on riscv64 architecture.
          </p>

          <h2>Test Coverage</h2>
          <ul>
            <li>Basic page rendering</li>
            <li>Client-side navigation</li>
            <li>Static Site Generation (SSG)</li>
            <li>Server-Side Rendering (SSR)</li>
            <li>API Routes</li>
            <li>Hot Module Replacement (HMR) in dev mode</li>
          </ul>

          <h2>Platform Information</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Architecture:</strong></td>
                <td>{process.arch}</td>
              </tr>
              <tr>
                <td><strong>Node.js Version:</strong></td>
                <td>{process.version}</td>
              </tr>
              <tr>
                <td><strong>Platform:</strong></td>
                <td>{process.platform}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Link href="/" className={styles.backLink}>
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

export default About

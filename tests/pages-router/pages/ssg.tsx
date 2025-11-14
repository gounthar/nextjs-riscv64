import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

interface Props {
  timestamp: string
  buildInfo: {
    arch: string
    nodeVersion: string
    platform: string
  }
}

const SSGTest: NextPage<Props> = ({ timestamp, buildInfo }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>SSG Test - Next.js on riscv64</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Static Site Generation (SSG) Test</h1>

        <div className={styles.description}>
          <p>
            This page is statically generated at build time using <code>getStaticProps</code>.
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

          <p className={styles.note}>
            ✅ If you see this page, SSG is working correctly on riscv64!
          </p>
        </div>

        <Link href="/" className={styles.backLink}>
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      timestamp: new Date().toISOString(),
      buildInfo: {
        arch: process.arch,
        nodeVersion: process.version,
        platform: process.platform,
      },
    },
  }
}

export default SSGTest

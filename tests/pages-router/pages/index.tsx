import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js on riscv64 - Pages Router Test</title>
        <meta name="description" content="Testing Next.js on riscv64 architecture" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.nextjs}>Next.js</span> on riscv64!
        </h1>

        <p className={styles.description}>
          This is a test application for validating Next.js on RISC-V 64-bit architecture
        </p>

        <div className={styles.grid}>
          <Link href="/about" className={styles.card}>
            <h2>About &rarr;</h2>
            <p>Learn about this test application</p>
          </Link>

          <Link href="/ssg" className={styles.card}>
            <h2>SSG Test &rarr;</h2>
            <p>Static Site Generation test page</p>
          </Link>

          <Link href="/ssr" className={styles.card}>
            <h2>SSR Test &rarr;</h2>
            <p>Server-Side Rendering test page</p>
          </Link>

          <Link href="/api-test" className={styles.card}>
            <h2>API Test &rarr;</h2>
            <p>Test API routes functionality</p>
          </Link>
        </div>

        <div className={styles.info}>
          <p>Architecture: <strong>{process.arch}</strong></p>
          <p>Node Version: <strong>{process.version}</strong></p>
          <p>Platform: <strong>{process.platform}</strong></p>
        </div>
      </main>
    </div>
  )
}

export default Home

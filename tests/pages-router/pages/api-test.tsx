import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

const APITest: NextPage = () => {
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      setApiResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>API Test - Next.js on riscv64</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>API Routes Test</h1>

        <div className={styles.description}>
          <p>
            Test Next.js API routes functionality on riscv64.
          </p>

          <button
            onClick={testAPI}
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Testing...' : 'Test API Route'}
          </button>

          {error && (
            <div className={styles.error}>
              <h3>Error:</h3>
              <pre>{error}</pre>
            </div>
          )}

          {apiResponse && (
            <div className={styles.success}>
              <h3>API Response:</h3>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          )}

          <p className={styles.note}>
            ✅ If you see a successful API response, API routes are working correctly!
          </p>
        </div>

        <Link href="/" className={styles.backLink}>
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

export default APITest

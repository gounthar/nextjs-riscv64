'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function APITest() {
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
    <div className="container">
      <main className="main">
        <h1 className="title">API Routes Test</h1>

        <div className="description">
          <p>
            Test Next.js App Router API routes functionality on riscv64.
          </p>

          <button
            onClick={testAPI}
            disabled={loading}
            className="button"
          >
            {loading ? 'Testing...' : 'Test API Route'}
          </button>

          {error && (
            <div className="error">
              <h3>Error:</h3>
              <pre>{error}</pre>
            </div>
          )}

          {apiResponse && (
            <div className="success">
              <h3>API Response:</h3>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          )}

          <p className="note">
            ✅ If you see a successful API response, API routes are working correctly!
          </p>
        </div>

        <Link href="/" className="backLink">
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

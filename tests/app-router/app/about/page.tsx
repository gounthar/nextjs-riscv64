import Link from 'next/link'

export default function About() {
  return (
    <div className="container">
      <main className="main">
        <h1 className="title">About This Test</h1>

        <div className="description">
          <p>
            This application tests Next.js App Router functionality on riscv64 architecture.
          </p>

          <h2>Test Coverage</h2>
          <ul>
            <li>React Server Components</li>
            <li>Client-side navigation</li>
            <li>Static rendering</li>
            <li>Dynamic rendering</li>
            <li>API Routes</li>
            <li>Server Actions (experimental)</li>
            <li>Streaming</li>
          </ul>

          <h2>App Router Features</h2>
          <ul>
            <li>File-based routing in <code>app/</code> directory</li>
            <li>Layouts and nested routes</li>
            <li>Server Components by default</li>
            <li>Improved data fetching</li>
            <li>Built-in loading and error states</li>
          </ul>
        </div>

        <Link href="/" className="backLink">
          &larr; Back to Home
        </Link>
      </main>
    </div>
  )
}

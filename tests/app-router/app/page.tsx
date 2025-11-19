import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <main className="main">
        <h1 className="title">
          Welcome to <span className="nextjs">Next.js</span> on riscv64!
        </h1>

        <p className="description">
          This is a test application for validating Next.js App Router on RISC-V 64-bit architecture
        </p>

        <div className="grid">
          <Link href="/about" className="card">
            <h2>About &rarr;</h2>
            <p>Learn about this test application</p>
          </Link>

          <Link href="/ssg" className="card">
            <h2>SSG Test &rarr;</h2>
            <p>Static rendering with React Server Components</p>
          </Link>

          <Link href="/ssr" className="card">
            <h2>Dynamic Test &rarr;</h2>
            <p>Dynamic rendering test page</p>
          </Link>

          <Link href="/api-test" className="card">
            <h2>API Test &rarr;</h2>
            <p>Test API routes functionality</p>
          </Link>
        </div>

        <div className="info">
          <p>Architecture: <strong>riscv64</strong></p>
          <p>Next.js: <strong>14.2.0 (App Router)</strong></p>
          <p>React: <strong>18.3.0</strong></p>
        </div>
      </main>
    </div>
  )
}

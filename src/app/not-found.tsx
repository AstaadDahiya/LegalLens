import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found — LegalLens',
  description: 'The page you are looking for does not exist.',
};

/**
 * Custom 404 page with navigation back to available features.
 */
export default function NotFound() {
  return (
    <div className="container page-wrapper" style={{ textAlign: 'center' }}>
      <div style={{ padding: '4rem 0' }}>
        <div
          style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.5 }}
          aria-hidden="true"
        >
          🔍
        </div>
        <h1 style={{ marginBottom: '0.75rem' }}>Page Not Found</h1>
        <p
          style={{
            maxWidth: '440px',
            margin: '0 auto 2rem',
            fontSize: '1rem',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Here are some tools you can use instead:
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
        >
          <Link href="/" className="btn btn-primary">
            🏠 Go Home
          </Link>
          <Link href="/simplify" className="btn btn-secondary">
            📄 Simplify a Document
          </Link>
          <Link href="/chat" className="btn btn-secondary">
            💬 Chat with a Document
          </Link>
        </div>
      </div>
    </div>
  );
}

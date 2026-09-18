'use client';

/**
 * Global error boundary for unhandled errors.
 * Provides a user-friendly fallback UI when something goes wrong.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: '#0a0b14',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: '2rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '480px',
          }}
        >
          <div
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: '#f1f5f9',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              fontSize: '0.95rem',
            }}
          >
            An unexpected error occurred. This could be a temporary issue.
            Please try again or return to the home page.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <pre
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontSize: '0.8rem',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px',
                marginBottom: '1.5rem',
                color: '#f43f5e',
              }}
            >
              {error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                background: 'rgba(22, 24, 48, 0.6)',
                color: '#e2e8f0',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
                fontFamily: 'inherit',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LegalLens — AI-Powered Legal Document Assistant',
  description:
    'Make legal documents accessible with AI. Simplify contracts, compare agreements, analyze clauses, and get answers to your legal questions — powered by Google Gemini.',
  keywords: [
    'legal AI',
    'document simplifier',
    'contract comparison',
    'clause analysis',
    'legal assistant',
    'legal tech',
  ],
  authors: [{ name: 'LegalLens' }],
  openGraph: {
    title: 'LegalLens — AI-Powered Legal Document Assistant',
    description: 'Make legal documents accessible with AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="sr-only" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          padding: '1rem',
          background: 'var(--color-accent-primary)',
          color: '#fff',
          zIndex: 1000,
          textDecoration: 'none',
        }}>
          Skip to main content
        </a>
        <Header />
        <main id="main-content" role="main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

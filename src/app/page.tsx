import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LegalLens — AI-Powered Legal Document Assistant',
  description:
    'Make complex legal documents accessible. Simplify, compare, analyze, and chat with your legal documents using Google Gemini AI.',
};

const features = [
  {
    href: '/simplify',
    icon: '📄',
    iconClass: 'feature-icon--simplify',
    title: 'Document Simplifier',
    description:
      'Transform complex legal language into plain English. Get clear summaries, key points, and important terms explained.',
  },
  {
    href: '/compare',
    icon: '⚖️',
    iconClass: 'feature-icon--compare',
    title: 'Contract Comparator',
    description:
      'Compare two legal documents side-by-side. Identify key differences, risks, and missing provisions at a glance.',
  },
  {
    href: '/analyze',
    icon: '🔍',
    iconClass: 'feature-icon--analyze',
    title: 'Clause Analyzer',
    description:
      'Extract and categorize every clause with risk ratings. Understand obligations, rights, liabilities, and more.',
  },
  {
    href: '/chat',
    icon: '💬',
    iconClass: 'feature-icon--chat',
    title: 'Legal Q&A Chat',
    description:
      'Ask questions about your documents in natural language. Get contextual answers with relevant clause references.',
  },
  {
    href: '/checklist',
    icon: '✅',
    iconClass: 'feature-icon--checklist',
    title: 'Checklist Generator',
    description:
      'Generate actionable checklists from legal documents. Track obligations, deadlines, and compliance requirements.',
  },
  {
    href: '/glossary',
    icon: '📖',
    iconClass: 'feature-icon--glossary',
    title: 'Legal Glossary',
    description:
      'Identify and explain every piece of legal jargon in your document. Get plain-English definitions with examples.',
  },
];

export default function HomePage() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-heading">
        <span className="hero-badge">
          <span aria-hidden="true">✨</span>
          Powered by Google Gemini AI
        </span>

        <h1 id="hero-heading">
          Make Legal Documents{' '}
          <span className="hero-gradient-text">Actually Understandable</span>
        </h1>

        <p>
          Upload any legal document and get instant AI-powered analysis.
          Simplify complex language, compare contracts, identify risks,
          and prepare informed questions for your attorney.
        </p>

        <div className="hero-actions">
          <Link href="/simplify" className="btn btn-primary btn-lg">
            📄 Start Simplifying
          </Link>
          <Link href="/chat" className="btn btn-secondary btn-lg">
            💬 Chat with a Document
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>

        <div className="feature-grid">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="feature-card"
            >
              <div className={`feature-icon ${feature.iconClass}`}>
                <span aria-hidden="true">{feature.icon}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust indicators */}
      <section
        className="text-center mt-xl"
        style={{ padding: '3rem 0' }}
        aria-labelledby="trust-heading"
      >
        <h2 id="trust-heading" className="sr-only">How it works</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          flexWrap: 'wrap',
          opacity: 0.7,
        }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
            <p style={{ fontSize: '0.85rem' }}>Privacy-First<br/>Documents never stored</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <p style={{ fontSize: '0.85rem' }}>Instant Analysis<br/>Results in seconds</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <p style={{ fontSize: '0.85rem' }}>AI-Powered<br/>Google Gemini 2.0</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>♿</div>
            <p style={{ fontSize: '0.85rem' }}>Accessible<br/>WCAG 2.1 AA</p>
          </div>
        </div>
      </section>
    </div>
  );
}

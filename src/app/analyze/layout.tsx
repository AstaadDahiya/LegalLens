import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clause Analyzer',
  description: 'Extract and categorize every clause in your legal document with AI risk ratings and plain-English explanations.',
};

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

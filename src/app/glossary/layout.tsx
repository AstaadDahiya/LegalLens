import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Glossary',
  description: 'Identify and explain legal terminology in your documents. Get plain-English definitions with real-world examples.',
};

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

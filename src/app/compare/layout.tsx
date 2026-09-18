import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contract Comparator',
  description: 'Compare two legal documents side-by-side with AI. Identify key differences, risks, and missing provisions.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}

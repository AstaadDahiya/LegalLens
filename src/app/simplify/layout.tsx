import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Simplifier',
  description: 'Transform complex legal language into plain English with AI. Get clear summaries, key points, and important terms explained.',
};

export default function SimplifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

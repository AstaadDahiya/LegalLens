import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Q&A Chat',
  description: 'Ask questions about your legal documents in natural language. Get contextual AI answers based on document content.',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}

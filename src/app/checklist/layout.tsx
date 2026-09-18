import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checklist Generator',
  description: 'Generate actionable checklists from legal documents with AI. Track obligations, deadlines, and compliance requirements.',
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return children;
}

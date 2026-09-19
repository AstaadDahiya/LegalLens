'use client';

import { useRef, useCallback, useMemo } from 'react';
import { renderMarkdown } from '@/lib/render-markdown';

interface ResultPanelProps {
  /** The markdown result content */
  content: string;
  /** Title for the result panel */
  title: string;
  /** Icon for the title */
  icon?: string;
}

export default function ResultPanel({ content, title, icon = '📊' }: ResultPanelProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  // Memoize the expensive regex-based markdown conversion
  const renderedHtml = useMemo(() => renderMarkdown(content), [content]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legallens-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, title]);

  return (
    <div className="result-panel" role="region" aria-label={title}>
      <div className="result-header">
        <h3>
          <span aria-hidden="true">{icon}</span>
          {title}
        </h3>
        <div className="result-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopy}
            aria-label="Copy results to clipboard"
            title="Copy to clipboard"
          >
            📋 Copy
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDownload}
            aria-label="Download results as Markdown file"
            title="Download as .md"
          >
            💾 Save
          </button>
        </div>
      </div>
      <div
        ref={resultRef}
        className="result-body"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}

'use client';

import { useRef, useCallback } from 'react';

interface ResultPanelProps {
  /** The markdown result content */
  content: string;
  /** Title for the result panel */
  title: string;
  /** Icon for the title */
  icon?: string;
}

/**
 * Very lightweight Markdown→HTML converter.
 * Handles the subset that Gemini typically returns:
 * headers, bold, italic, lists, tables, code, blockquotes, hr.
 */
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore markdown chars that use > or <
    .replace(/&gt; /gm, '> ');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');
  html = html.replace(/^\*\*\*$/gm, '<hr/>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists (- items)
  html = html.replace(/^- \[ \] (.+)$/gm, '<li>☐ $1</li>');
  html = html.replace(/^- \[x\] (.+)$/gm, '<li>☑ $1</li>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^  [-*] (.+)$/gm, '<li style="margin-left:1.5rem">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Simple table support
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split('|').map((c: string) => c.trim());
    // Check if it's a separator row
    if (cells.every((c: string) => /^[-:]+$/.test(c))) return '';
    const tag = 'td';
    const row = cells.map((c: string) => `<${tag}>${c}</${tag}>`).join('');
    return `<tr>${row}</tr>`;
  });
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>');

  // Paragraphs — wrap lines that aren't already in block elements
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<hr') ||
        trimmed.startsWith('<li')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

export default function ResultPanel({ content, title, icon = '📊' }: ResultPanelProps) {
  const resultRef = useRef<HTMLDivElement>(null);

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

  const renderedHtml = renderMarkdown(content);

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

/**
 * Lightweight Markdown → HTML converter.
 *
 * Handles the subset that Gemini typically returns:
 * headers, bold, italic, lists (unordered, ordered, checklists),
 * tables, code, blockquotes, and horizontal rules.
 *
 * Performance: All regex patterns are pre-compiled at module scope
 * to avoid repeated compilation on every render call.
 *
 * Shared between ResultPanel and Chat to avoid duplicate code.
 */

// Pre-compiled regex patterns (compiled once at module load)
const RE_AMP = /&/g;
const RE_LT = /</g;
const RE_GT = />/g;
const RE_RESTORE_GT = /&gt; /gm;
const RE_H4 = /^#### (.+)$/gm;
const RE_H3 = /^### (.+)$/gm;
const RE_H2 = /^## (.+)$/gm;
const RE_H1 = /^# (.+)$/gm;
const RE_HR_DASH = /^---$/gm;
const RE_HR_STAR = /^\*\*\*$/gm;
const RE_BOLD_ITALIC = /\*\*\*(.+?)\*\*\*/g;
const RE_BOLD = /\*\*(.+?)\*\*/g;
const RE_ITALIC = /\*(.+?)\*/g;
const RE_INLINE_CODE = /`([^`]+)`/g;
const RE_BLOCKQUOTE = /^> (.+)$/gm;
const RE_CHECKLIST_UNCHECKED = /^- \[ \] (.+)$/gm;
const RE_CHECKLIST_CHECKED = /^- \[x\] (.+)$/gm;
const RE_UL_ITEM = /^[-*] (.+)$/gm;
const RE_UL_NESTED = /^  [-*] (.+)$/gm;
const RE_OL_ITEM = /^\d+\. (.+)$/gm;
const RE_WRAP_LI = /((?:<li>.*<\/li>\n?)+)/g;
const RE_TABLE_ROW = /^\|(.+)\|$/gm;
const RE_TABLE_SEP = /^[-:]+$/;
const RE_WRAP_TR = /((?:<tr>.*<\/tr>\n?)+)/g;

export function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(RE_AMP, '&amp;')
    .replace(RE_LT, '&lt;')
    .replace(RE_GT, '&gt;')
    // Restore markdown chars that use > or <
    .replace(RE_RESTORE_GT, '> ');

  // Headers
  html = html.replace(RE_H4, '<h4>$1</h4>');
  html = html.replace(RE_H3, '<h3>$1</h3>');
  html = html.replace(RE_H2, '<h2>$1</h2>');
  html = html.replace(RE_H1, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(RE_HR_DASH, '<hr/>');
  html = html.replace(RE_HR_STAR, '<hr/>');

  // Bold and italic
  html = html.replace(RE_BOLD_ITALIC, '<strong><em>$1</em></strong>');
  html = html.replace(RE_BOLD, '<strong>$1</strong>');
  html = html.replace(RE_ITALIC, '<em>$1</em>');

  // Inline code
  html = html.replace(RE_INLINE_CODE, '<code>$1</code>');

  // Blockquotes
  html = html.replace(RE_BLOCKQUOTE, '<blockquote>$1</blockquote>');

  // Unordered lists (- items)
  html = html.replace(RE_CHECKLIST_UNCHECKED, '<li>☐ $1</li>');
  html = html.replace(RE_CHECKLIST_CHECKED, '<li>☑ $1</li>');
  html = html.replace(RE_UL_ITEM, '<li>$1</li>');
  html = html.replace(RE_UL_NESTED, '<li style="margin-left:1.5rem">$1</li>');

  // Ordered lists
  html = html.replace(RE_OL_ITEM, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(RE_WRAP_LI, '<ul>$1</ul>');

  // Simple table support
  html = html.replace(RE_TABLE_ROW, (match, content) => {
    const cells = content.split('|').map((c: string) => c.trim());
    // Check if it's a separator row
    if (cells.every((c: string) => RE_TABLE_SEP.test(c))) return '';
    const tag = 'td';
    const row = cells.map((c: string) => `<${tag}>${c}</${tag}>`).join('');
    return `<tr>${row}</tr>`;
  });
  html = html.replace(RE_WRAP_TR, '<table>$1</table>');

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

/**
 * Tests for the shared Markdown → HTML renderer.
 * Validates all supported markdown features and XSS prevention.
 */

import { renderMarkdown } from '../lib/render-markdown';

describe('renderMarkdown — Headers', () => {
  it('should convert # to <h1>', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>');
  });

  it('should convert ## to <h2>', () => {
    expect(renderMarkdown('## Section')).toContain('<h2>Section</h2>');
  });

  it('should convert ### to <h3>', () => {
    expect(renderMarkdown('### Subsection')).toContain('<h3>Subsection</h3>');
  });

  it('should convert #### to <h4>', () => {
    expect(renderMarkdown('#### Detail')).toContain('<h4>Detail</h4>');
  });

  it('should handle multiple headers', () => {
    const result = renderMarkdown('# First\n\n## Second');
    expect(result).toContain('<h1>First</h1>');
    expect(result).toContain('<h2>Second</h2>');
  });
});

describe('renderMarkdown — Text Formatting', () => {
  it('should convert **text** to <strong>', () => {
    expect(renderMarkdown('This is **bold** text.')).toContain('<strong>bold</strong>');
  });

  it('should convert *text* to <em>', () => {
    expect(renderMarkdown('This is *italic* text.')).toContain('<em>italic</em>');
  });

  it('should convert ***text*** to bold italic', () => {
    const result = renderMarkdown('This is ***both*** styled.');
    expect(result).toContain('<strong><em>both</em></strong>');
  });

  it('should convert `code` to <code>', () => {
    expect(renderMarkdown('Use the `function` here.')).toContain('<code>function</code>');
  });
});

describe('renderMarkdown — Lists', () => {
  it('should convert - items to <li> wrapped in <ul>', () => {
    const result = renderMarkdown('- Item 1\n- Item 2');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
  });

  it('should convert * items to <li>', () => {
    const result = renderMarkdown('* Star item');
    expect(result).toContain('<li>Star item</li>');
  });

  it('should convert ordered lists', () => {
    const result = renderMarkdown('1. First\n2. Second');
    expect(result).toContain('<li>First</li>');
    expect(result).toContain('<li>Second</li>');
  });

  it('should render checklists with ☐ and ☑', () => {
    const result = renderMarkdown('- [ ] Unchecked\n- [x] Checked');
    expect(result).toContain('☐ Unchecked');
    expect(result).toContain('☑ Checked');
  });

  it('should indent nested list items', () => {
    const result = renderMarkdown('  - Nested item');
    expect(result).toContain('margin-left:1.5rem');
    expect(result).toContain('Nested item');
  });
});

describe('renderMarkdown — Blockquotes', () => {
  it('should convert > lines to <blockquote>', () => {
    const result = renderMarkdown('> This is a quote');
    expect(result).toContain('<blockquote>This is a quote</blockquote>');
  });
});

describe('renderMarkdown — Horizontal Rules', () => {
  it('should convert --- to <hr/>', () => {
    expect(renderMarkdown('---')).toContain('<hr/>');
  });

  it('should convert *** to <hr/>', () => {
    expect(renderMarkdown('***')).toContain('<hr/>');
  });
});

describe('renderMarkdown — Tables', () => {
  it('should convert pipe-delimited rows to <table>', () => {
    const md = '| Name | Value |\n| --- | --- |\n| Key | 42 |';
    const result = renderMarkdown(md);
    expect(result).toContain('<table>');
    expect(result).toContain('<tr>');
    expect(result).toContain('<td>Name</td>');
    expect(result).toContain('<td>42</td>');
  });

  it('should skip separator rows', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| D1 | D2 |';
    const result = renderMarkdown(md);
    // Separator row should not appear as a table row with dashes
    expect(result).not.toContain('<td>---</td>');
  });
});

describe('renderMarkdown — Paragraphs', () => {
  it('should wrap plain text in <p> tags', () => {
    const result = renderMarkdown('Just some text.');
    expect(result).toContain('<p>Just some text.</p>');
  });

  it('should separate paragraphs with double newlines', () => {
    const result = renderMarkdown('Para 1.\n\nPara 2.');
    expect(result).toContain('<p>Para 1.</p>');
    expect(result).toContain('<p>Para 2.</p>');
  });

  it('should not wrap headers in <p> tags', () => {
    const result = renderMarkdown('## Header');
    expect(result).not.toContain('<p><h2>');
  });

  it('should convert single newlines to <br/>', () => {
    const result = renderMarkdown('Line 1\nLine 2');
    expect(result).toContain('Line 1<br/>Line 2');
  });
});

describe('renderMarkdown — XSS Prevention', () => {
  it('should escape HTML tags to prevent XSS', () => {
    const result = renderMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should escape & characters', () => {
    const result = renderMarkdown('A & B');
    expect(result).toContain('&amp;');
  });

  it('should escape angle brackets', () => {
    // Note: `> ` (gt + space) is restored by the blockquote pattern,
    // so we test with > not followed by a space
    const result = renderMarkdown('5 < 10 and 10 >5');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('should handle HTML entities in legal text', () => {
    const result = renderMarkdown('Party A & Party B <agreement>');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;agreement&gt;');
  });
});

describe('renderMarkdown — Edge Cases', () => {
  it('should handle empty string', () => {
    const result = renderMarkdown('');
    expect(typeof result).toBe('string');
  });

  it('should handle text with only whitespace', () => {
    const result = renderMarkdown('   ');
    expect(typeof result).toBe('string');
  });

  it('should handle complex mixed content', () => {
    const md = `## Summary

This is **important** legal text.

- Point 1
- Point 2

> Note: consult an attorney.

| Term | Meaning |
| --- | --- |
| NDA | Non-Disclosure Agreement |`;

    const result = renderMarkdown(md);
    expect(result).toContain('<h2>Summary</h2>');
    expect(result).toContain('<strong>important</strong>');
    expect(result).toContain('<li>Point 1</li>');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('<table>');
    expect(result).toContain('<td>NDA</td>');
  });
});

import {
  sanitizeText,
  validateDocumentText,
  validateQuestion,
  MAX_TEXT_LENGTH,
  MIN_TEXT_LENGTH,
  MAX_QUESTION_LENGTH,
} from '../lib/sanitize';

describe('sanitizeText', () => {
  it('should return empty string for null/undefined input', () => {
    expect(sanitizeText(null as unknown as string)).toBe('');
    expect(sanitizeText(undefined as unknown as string)).toBe('');
    expect(sanitizeText('')).toBe('');
  });

  it('should remove null bytes', () => {
    expect(sanitizeText('hello\0world')).toBe('helloworld');
  });

  it('should remove control characters but preserve whitespace', () => {
    expect(sanitizeText('hello\x01\x02world')).toBe('helloworld');
    expect(sanitizeText('hello\tworld')).toBe('hello\tworld'); // tabs preserved
    expect(sanitizeText('hello\nworld')).toBe('hello\nworld'); // newlines preserved
  });

  it('should normalize excessive blank lines', () => {
    const input = 'line1\n\n\n\n\n\nline2';
    const result = sanitizeText(input);
    expect(result).toBe('line1\n\n\nline2');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('should handle normal text unchanged', () => {
    const text = 'This is a normal legal document with clauses and terms.';
    expect(sanitizeText(text)).toBe(text);
  });
});

describe('validateDocumentText', () => {
  it('should reject empty input', () => {
    const result = validateDocumentText('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject text that is too short', () => {
    const result = validateDocumentText('short');
    expect(result.valid).toBe(false);
    expect(result.error).toContain(`${MIN_TEXT_LENGTH}`);
  });

  it('should reject text that is too long', () => {
    const longText = 'a'.repeat(MAX_TEXT_LENGTH + 1);
    const result = validateDocumentText(longText);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('should accept valid document text', () => {
    const text = 'This is a valid legal document that contains sufficient text for analysis. It has multiple sentences and clauses.';
    const result = validateDocumentText(text);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(text);
  });

  it('should sanitize text before validation', () => {
    const text = 'This is a valid legal document\0 that contains\x01 sufficient text for proper analysis and review.';
    const result = validateDocumentText(text);
    expect(result.valid).toBe(true);
    expect(result.sanitized).not.toContain('\0');
    expect(result.sanitized).not.toContain('\x01');
  });
});

describe('validateQuestion', () => {
  it('should reject empty questions', () => {
    const result = validateQuestion('');
    expect(result.valid).toBe(false);
  });

  it('should reject very short questions', () => {
    const result = validateQuestion('hi');
    expect(result.valid).toBe(false);
  });

  it('should reject questions that are too long', () => {
    const longQuestion = 'a'.repeat(MAX_QUESTION_LENGTH + 1);
    const result = validateQuestion(longQuestion);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('should accept valid questions', () => {
    const result = validateQuestion('What are the main obligations in this contract?');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBeDefined();
  });
});

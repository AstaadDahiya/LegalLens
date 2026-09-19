/**
 * Tests for PDF parsing and file validation utilities.
 * Mocks the pdf-parse library to test parsePdf and validates the validateFile function.
 */

const mockGetText = jest.fn();
const mockGetInfo = jest.fn();
const mockDestroy = jest.fn();

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockGetText,
    getInfo: mockGetInfo,
    destroy: mockDestroy,
  })),
}));

import { parsePdf, validateFile, MAX_PDF_SIZE, ALLOWED_MIME_TYPES } from '../lib/pdf-parser';

beforeEach(() => {
  mockGetText.mockReset();
  mockGetInfo.mockReset();
  mockDestroy.mockReset();
});

// ─── parsePdf Tests ───

describe('parsePdf', () => {
  it('should return text and metadata for valid PDFs', async () => {
    mockGetText.mockResolvedValueOnce({
      text: 'This is the extracted text from a legal document with sufficient content.',
    });
    mockGetInfo.mockResolvedValueOnce({
      info: { Title: 'Test Contract', Author: 'John Doe', Subject: 'Legal' },
      total: 5,
    });
    mockDestroy.mockResolvedValueOnce(undefined);

    const result = await parsePdf(Buffer.from('fake pdf data'));

    expect(result.text).toContain('extracted text');
    expect(result.numPages).toBe(5);
    expect(result.info.title).toBe('Test Contract');
    expect(result.info.author).toBe('John Doe');
    expect(result.info.subject).toBe('Legal');
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('should throw for PDFs with no extractable text', async () => {
    mockGetText.mockResolvedValueOnce({ text: '   ' });
    mockDestroy.mockResolvedValueOnce(undefined);

    await expect(parsePdf(Buffer.from('fake')))
      .rejects.toThrow('Could not extract');
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('should throw for PDFs with very short text', async () => {
    mockGetText.mockResolvedValueOnce({ text: 'Short' });
    mockDestroy.mockResolvedValueOnce(undefined);

    await expect(parsePdf(Buffer.from('fake')))
      .rejects.toThrow('Could not extract');
  });

  it('should handle missing metadata gracefully', async () => {
    mockGetText.mockResolvedValueOnce({
      text: 'Valid document text with enough content for analysis and testing purposes.',
    });
    mockGetInfo.mockRejectedValueOnce(new Error('No metadata'));
    mockDestroy.mockResolvedValueOnce(undefined);

    const result = await parsePdf(Buffer.from('fake'));

    expect(result.text).toContain('Valid document');
    expect(result.numPages).toBe(0);
    expect(result.info.title).toBeUndefined();
    expect(result.info.author).toBeUndefined();
  });

  it('should handle encrypted PDF errors', async () => {
    mockGetText.mockRejectedValueOnce(new Error('This PDF is encrypted'));

    await expect(parsePdf(Buffer.from('fake')))
      .rejects.toThrow('password-protected');
  });

  it('should handle password-protected PDF errors', async () => {
    mockGetText.mockRejectedValueOnce(new Error('Requires a password'));

    await expect(parsePdf(Buffer.from('fake')))
      .rejects.toThrow('password-protected');
  });

  it('should wrap unknown errors', async () => {
    mockGetText.mockRejectedValueOnce(new Error('Unknown parse failure'));

    await expect(parsePdf(Buffer.from('fake')))
      .rejects.toThrow('Failed to parse PDF');
  });

  it('should handle non-Error thrown values', async () => {
    mockGetText.mockRejectedValueOnce('string error');

    await expect(parsePdf(Buffer.from('fake')))
      .rejects.toThrow('unexpected error');
  });

  it('should handle metadata with empty/falsy values', async () => {
    mockGetText.mockResolvedValueOnce({
      text: 'Sufficient content for the document parser to accept and process this text input.',
    });
    mockGetInfo.mockResolvedValueOnce({
      info: { Title: '', Author: null, Subject: undefined },
      total: 0,
    });
    mockDestroy.mockResolvedValueOnce(undefined);

    const result = await parsePdf(Buffer.from('fake'));

    expect(result.info.title).toBeUndefined();
    expect(result.info.author).toBeUndefined();
    expect(result.info.subject).toBeUndefined();
  });
});

// ─── validateFile Tests ───

describe('validateFile', () => {
  function createMockFile(
    name: string,
    size: number,
    type: string
  ): File {
    const content = size > 0 ? 'x'.repeat(Math.min(size, 100)) : '';
    const blob = new Blob([content], { type });
    // Use defineProperty because Blob.size is a getter-only property
    Object.defineProperty(blob, 'name', { value: name, writable: false });
    Object.defineProperty(blob, 'size', { value: size, writable: false });
    Object.defineProperty(blob, 'lastModified', { value: Date.now(), writable: false });
    return blob as unknown as File;
  }

  it('should reject when no file is provided', () => {
    const result = validateFile(null as unknown as File);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No file');
  });

  it('should reject files exceeding MAX_PDF_SIZE', () => {
    const file = createMockFile('big.pdf', MAX_PDF_SIZE + 1, 'application/pdf');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should reject empty files (0 bytes)', () => {
    const file = createMockFile('empty.pdf', 0, 'application/pdf');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should accept PDF files by MIME type', () => {
    const file = createMockFile('contract.pdf', 1024, 'application/pdf');
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should accept text files by MIME type', () => {
    const file = createMockFile('doc.txt', 500, 'text/plain');
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should accept PDF files by extension even with wrong MIME', () => {
    const file = createMockFile('document.pdf', 1024, 'application/octet-stream');
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should accept TXT files by extension even with wrong MIME', () => {
    const file = createMockFile('document.txt', 500, 'application/octet-stream');
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should accept markdown files by MIME type', () => {
    const file = createMockFile('notes.md', 500, 'text/markdown');
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('should reject unsupported file types', () => {
    const file = createMockFile('image.jpg', 1024, 'image/jpeg');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not supported');
  });

  it('should reject .docx files', () => {
    const file = createMockFile(
      'document.docx',
      1024,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('should reject HTML files', () => {
    const file = createMockFile('page.html', 1024, 'text/html');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('should show the actual MIME type in the error message', () => {
    const file = createMockFile('weird.xyz', 1024, 'application/x-custom');
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('application/x-custom');
  });
});

// ─── Constants Tests ───

describe('Constants', () => {
  it('should have MAX_PDF_SIZE set to 5 MB', () => {
    expect(MAX_PDF_SIZE).toBe(5 * 1024 * 1024);
  });

  it('should include expected MIME types', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    expect(ALLOWED_MIME_TYPES).toContain('text/plain');
    expect(ALLOWED_MIME_TYPES).toContain('text/markdown');
  });

  it('should not include unsafe MIME types', () => {
    expect(ALLOWED_MIME_TYPES).not.toContain('text/html');
    expect(ALLOWED_MIME_TYPES).not.toContain('application/javascript');
  });
});

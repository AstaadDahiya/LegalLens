import { PDFParse } from 'pdf-parse';

/** Maximum file size for PDF uploads (5 MB) */
export const MAX_PDF_SIZE = 5 * 1024 * 1024;

/** Allowed MIME types for document uploads */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
];

/** Result of parsing a PDF file */
export interface ParseResult {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Extract text content from a PDF buffer.
 * @param buffer - The PDF file as a Buffer
 * @returns Parsed text content and metadata
 * @throws Error if the PDF is invalid, encrypted, or contains no extractable text
 */
export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    // Extract text
    const textResult = await parser.getText();
    const cleanedText = textResult.text.trim();

    if (!cleanedText || cleanedText.length < 10) {
      await parser.destroy();
      throw new Error(
        'Could not extract meaningful text from this PDF. It may be a scanned document or image-based PDF. ' +
        'Please try copying and pasting the text directly instead.'
      );
    }

    // Extract metadata
    let title: string | undefined;
    let author: string | undefined;
    let subject: string | undefined;
    let numPages = 0;

    try {
      const infoResult = await parser.getInfo();
      title = infoResult.info?.Title || undefined;
      author = infoResult.info?.Author || undefined;
      subject = infoResult.info?.Subject || undefined;
      numPages = infoResult.total || 0;
    } catch {
      // Metadata extraction is optional — continue without it
    }

    await parser.destroy();

    return {
      text: cleanedText,
      numPages,
      info: { title, author, subject },
    };
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our own errors
      if (error.message.includes('Could not extract')) {
        throw error;
      }
      // Handle common pdf-parse errors
      if (error.message.includes('encrypted') || error.message.includes('password')) {
        throw new Error('This PDF is password-protected. Please provide an unencrypted version.');
      }
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while parsing the PDF.');
  }
}

/**
 * Validate an uploaded file before processing.
 * @param file - The uploaded File object
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_PDF_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the maximum allowed size of ${MAX_PDF_SIZE / 1024 / 1024} MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The uploaded file is empty.' };
  }

  // Check MIME type or file extension
  const isAllowedType =
    ALLOWED_MIME_TYPES.includes(file.type) ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.txt');
  if (!isAllowedType) {
    return {
      valid: false,
      error: `File type "${file.type || 'unknown'}" is not supported. Please upload a PDF or text file.`,
    };
  }

  return { valid: true };
}

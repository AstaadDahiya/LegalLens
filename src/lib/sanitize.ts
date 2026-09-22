/**
 * Input sanitization and validation utilities.
 * Ensures all user-provided text is safe for processing.
 *
 * Performance: Regex patterns are compiled once at module scope
 * instead of being re-created on every function call.
 */

/** Maximum allowed text length (approximately 100 pages of text) */
export const MAX_TEXT_LENGTH = 500_000;

/** Minimum text length for meaningful analysis */
export const MIN_TEXT_LENGTH = 50;

/** Maximum question length for chat */
export const MAX_QUESTION_LENGTH = 2000;

/** Maximum request body size in bytes (10 MB) */
export const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024;

// Pre-compiled regex patterns for sanitization (avoids re-compilation per call)
const NULL_BYTE_RE = /\0/g;
const CONTROL_CHAR_RE = /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const EXCESSIVE_NEWLINES_RE = /\n{4,}/g;

/**
 * Strip potentially dangerous content from user input text.
 * Removes control characters while preserving legitimate text formatting.
 *
 * @param text - Raw user input
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove null bytes
    .replace(NULL_BYTE_RE, '')
    // Remove other control characters except common whitespace (tab, newline, carriage return)
    .replace(CONTROL_CHAR_RE, '')
    // Normalize excessive whitespace (more than 3 consecutive blank lines)
    .replace(EXCESSIVE_NEWLINES_RE, '\n\n\n')
    // Trim leading and trailing whitespace
    .trim();
}

/**
 * Validate document text for analysis.
 *
 * @param text - The document text to validate
 * @returns Validation result with error message if invalid
 */
export function validateDocumentText(text: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'No document text provided.' };
  }

  const sanitized = sanitizeText(text);

  if (sanitized.length < MIN_TEXT_LENGTH) {
    return {
      valid: false,
      error: `The document text is too short (${sanitized.length} characters). Please provide at least ${MIN_TEXT_LENGTH} characters for meaningful analysis.`,
    };
  }

  if (sanitized.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `The document text is too long (${(sanitized.length / 1000).toFixed(0)}K characters). Maximum allowed is ${(MAX_TEXT_LENGTH / 1000).toFixed(0)}K characters. Please provide a shorter document or extract the relevant sections.`,
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate a chat question.
 *
 * @param question - The user's question
 * @returns Validation result
 */
export function validateQuestion(question: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!question || typeof question !== 'string') {
    return { valid: false, error: 'No question provided.' };
  }

  const sanitized = sanitizeText(question);

  if (sanitized.length < 3) {
    return { valid: false, error: 'Question is too short. Please provide a more detailed question.' };
  }

  if (sanitized.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Question is too long (${sanitized.length} characters). Maximum allowed is ${MAX_QUESTION_LENGTH} characters.`,
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate the request body size to prevent oversized payloads.
 * Should be called early in API route handlers.
 *
 * @param contentLength - The Content-Length header value
 * @returns Validation result with error message if invalid
 */
export function validateRequestSize(contentLength: string | null): {
  valid: boolean;
  error?: string;
} {
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > MAX_REQUEST_BODY_SIZE) {
      return {
        valid: false,
        error: `Request body too large (${(size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${MAX_REQUEST_BODY_SIZE / 1024 / 1024} MB.`,
      };
    }
  }
  return { valid: true };
}

/**
 * Create a standardized error response object.
 */
export function createErrorResponse(message: string, status: number = 400) {
  return Response.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create a standardized success response object.
 * Includes Cache-Control headers for API response caching.
 */
export function createSuccessResponse(data: Record<string, unknown>) {
  return Response.json(
    {
      ...data,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes client-side
      },
    }
  );
}

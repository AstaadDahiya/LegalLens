/**
 * Input sanitization and validation utilities.
 * Ensures all user-provided text is safe for processing.
 */

/** Maximum allowed text length (approximately 100 pages of text) */
export const MAX_TEXT_LENGTH = 500_000;

/** Minimum text length for meaningful analysis */
export const MIN_TEXT_LENGTH = 50;

/** Maximum question length for chat */
export const MAX_QUESTION_LENGTH = 2000;

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
    .replace(/\0/g, '')
    // Remove other control characters except common whitespace (tab, newline, carriage return)
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize excessive whitespace (more than 3 consecutive blank lines)
    .replace(/\n{4,}/g, '\n\n\n')
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
 */
export function createSuccessResponse(data: Record<string, unknown>) {
  return Response.json({
    ...data,
    timestamp: new Date().toISOString(),
  });
}

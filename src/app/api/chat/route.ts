import { NextRequest } from 'next/server';
import { chatWithDocument } from '@/lib/gemini';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import {
  validateDocumentText,
  validateQuestion,
  validateRequestSize,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // Validate request size early to avoid processing oversized payloads
  const sizeCheck = validateRequestSize(request.headers.get('content-length'));
  if (!sizeCheck.valid) {
    return createErrorResponse(sizeCheck.error!, 413);
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
      429
    );
  }

  try {
    const body = await request.json();

    // Validate document text
    const docValidation = validateDocumentText(body.documentText);
    if (!docValidation.valid) {
      return createErrorResponse(docValidation.error!, 400);
    }

    // Validate question
    const questionValidation = validateQuestion(body.question);
    if (!questionValidation.valid) {
      return createErrorResponse(questionValidation.error!, 400);
    }

    // Validate history format
    const history = Array.isArray(body.history)
      ? body.history.filter(
          (msg: { role?: string; content?: string }) =>
            msg &&
            typeof msg.content === 'string' &&
            (msg.role === 'user' || msg.role === 'assistant')
        )
      : [];

    const result = await chatWithDocument(
      docValidation.sanitized!,
      questionValidation.sanitized!,
      history
    );

    return createSuccessResponse({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process question.';
    console.error('[API /chat]', message);
    return createErrorResponse(message, 500);
  }
}

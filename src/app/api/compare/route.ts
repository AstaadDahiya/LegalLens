import { NextRequest } from 'next/server';
import { compareDocuments } from '@/lib/gemini';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import {
  validateDocumentText,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/sanitize';

export async function POST(request: NextRequest) {
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

    const validationA = validateDocumentText(body.textA);
    if (!validationA.valid) {
      return createErrorResponse(`Document A: ${validationA.error}`, 400);
    }

    const validationB = validateDocumentText(body.textB);
    if (!validationB.valid) {
      return createErrorResponse(`Document B: ${validationB.error}`, 400);
    }

    const result = await compareDocuments(validationA.sanitized!, validationB.sanitized!);
    return createSuccessResponse({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to compare documents.';
    console.error('[API /compare]', message);
    return createErrorResponse(message, 500);
  }
}

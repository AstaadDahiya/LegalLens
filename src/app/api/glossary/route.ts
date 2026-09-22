import { NextRequest } from 'next/server';
import { extractGlossary } from '@/lib/gemini';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import {
  validateDocumentText,
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
    const validation = validateDocumentText(body.text);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }

    const result = await extractGlossary(validation.sanitized!);
    return createSuccessResponse({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract glossary.';
    console.error('[API /glossary]', message);
    return createErrorResponse(message, 500);
  }
}

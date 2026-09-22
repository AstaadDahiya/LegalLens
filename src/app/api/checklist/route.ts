import { NextRequest } from 'next/server';
import { generateChecklist } from '@/lib/gemini';
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

    const result = await generateChecklist(validation.sanitized!);
    return createSuccessResponse({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate checklist.';
    console.error('[API /checklist]', message);
    return createErrorResponse(message, 500);
  }
}

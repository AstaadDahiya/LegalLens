import { NextRequest } from 'next/server';
import { parsePdf, validateFile } from '@/lib/pdf-parser';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { createErrorResponse, createSuccessResponse } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
      429
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }

    // Convert to buffer and parse
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parsePdf(buffer);

    return createSuccessResponse({
      text: result.text,
      numPages: result.numPages,
      info: result.info,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse PDF.';
    return createErrorResponse(message, 422);
  }
}

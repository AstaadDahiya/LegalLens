import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy — applies security headers and basic protections
 * to all routes. Runs before every request is processed.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // ─── Content Security Policy ───
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // ─── Prevent MIME-type sniffing ───
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // ─── Clickjacking protection ───
  response.headers.set('X-Frame-Options', 'DENY');

  // ─── XSS protection (legacy browsers) ───
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // ─── Referrer policy ───
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ─── Permissions Policy ───
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // ─── Strict Transport Security (production only) ───
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // ─── CORS for API routes ───
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');

    // Block cross-origin API requests
    if (origin && !isSameOrigin(origin, request.nextUrl.origin)) {
      return new NextResponse(
        JSON.stringify({ error: 'Cross-origin requests are not allowed.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    response.headers.set('Access-Control-Allow-Origin', request.nextUrl.origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  return response;
}

/**
 * Check if two origins share the same hostname.
 */
function isSameOrigin(origin: string, target: string): boolean {
  try {
    const originUrl = new URL(origin);
    const targetUrl = new URL(target);
    return originUrl.hostname === targetUrl.hostname;
  } catch {
    return false;
  }
}

/**
 * Matcher — apply proxy to all routes except static assets.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

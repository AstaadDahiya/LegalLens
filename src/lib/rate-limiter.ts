/**
 * Simple in-memory token bucket rate limiter.
 * Limits requests per IP address to prevent API abuse.
 *
 * Note: This is suitable for single-instance deployments.
 * For distributed deployments, use Redis-based rate limiting.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Store buckets per IP address
const buckets = new Map<string, TokenBucket>();

// Configuration
const MAX_TOKENS = 20;       // Maximum requests in the bucket
const REFILL_RATE = 2;       // Tokens added per second
const CLEANUP_INTERVAL = 60 * 1000; // Clean up old entries every 60 seconds
const MAX_BUCKETS = 10_000;  // Cap bucket count to prevent unbounded memory growth

/**
 * Clean up expired buckets to prevent memory leaks.
 * Removes entries that haven't been accessed in 5 minutes.
 */
function cleanup(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key);
    }
  }
}

/**
 * Reset the rate limiter state. Used for test isolation.
 */
export function resetRateLimiter(): void {
  buckets.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Get the current number of tracked IP buckets. Used for testing/monitoring.
 */
export function getBucketCount(): number {
  return buckets.size;
}

/**
 * Manually trigger cleanup. Exported for testing only.
 * @internal
 */
export function _testOnly_triggerCleanup(): void {
  cleanup();
}

// Periodic cleanup
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup(): void {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL);
    // Allow Node.js to exit even if the timer is still running
    if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
      cleanupTimer.unref();
    }
  }
}

/**
 * Check if a request from the given identifier should be allowed.
 *
 * @param identifier - Unique identifier for the client (usually IP address)
 * @returns Object with `allowed` boolean and `remaining` tokens count
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
} {
  ensureCleanup();

  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket) {
    // Enforce bucket cap to prevent unbounded memory growth
    if (buckets.size >= MAX_BUCKETS) {
      cleanup();
    }
    // First request from this identifier
    bucket = { tokens: MAX_TOKENS - 1, lastRefill: now };
    buckets.set(identifier, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  // Calculate tokens to add based on time elapsed
  const elapsed = (now - bucket.lastRefill) / 1000; // Convert to seconds
  const tokensToAdd = elapsed * REFILL_RATE;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    // Rate limited — calculate when they can retry
    const retryAfter = Math.ceil((1 - bucket.tokens) / REFILL_RATE);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Consume a token
  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens) };
}

/**
 * Extract client IP from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return '127.0.0.1';
}

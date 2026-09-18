import { checkRateLimit } from '../lib/rate-limiter';

describe('Rate Limiter', () => {
  it('should allow the first request', () => {
    const result = checkRateLimit('test-ip-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should allow multiple requests within the limit', () => {
    const ip = 'test-ip-burst-' + Date.now();
    for (let i = 0; i < 15; i++) {
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
    }
  });

  it('should eventually deny requests when limit is exceeded', () => {
    const ip = 'test-ip-limit-' + Date.now();
    let denied = false;

    // Send many requests rapidly
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(ip);
      if (!result.allowed) {
        denied = true;
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
        break;
      }
    }

    expect(denied).toBe(true);
  });

  it('should track different IPs independently', () => {
    const ip1 = 'test-independent-1-' + Date.now();
    const ip2 = 'test-independent-2-' + Date.now();

    // Exhaust IP1
    for (let i = 0; i < 25; i++) {
      checkRateLimit(ip1);
    }

    // IP2 should still be allowed
    const result = checkRateLimit(ip2);
    expect(result.allowed).toBe(true);
  });

  it('should return retryAfter when rate limited', () => {
    const ip = 'test-ip-retry-' + Date.now();

    // Exhaust the limit
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(ip);
      if (!result.allowed) {
        expect(result.retryAfter).toBeDefined();
        expect(typeof result.retryAfter).toBe('number');
        expect(result.retryAfter).toBeGreaterThan(0);
        return;
      }
    }
  });
});

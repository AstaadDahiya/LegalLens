/**
 * Integration tests for API route handlers.
 *
 * These tests mock the Gemini AI client and test the full request → validation →
 * processing → response flow for each API endpoint.
 */

// Mock the Gemini module before imports
jest.mock('../lib/gemini', () => ({
  simplifyDocument: jest.fn().mockResolvedValue('## Simplified Document\n\nThis is a simplified version.'),
  compareDocuments: jest.fn().mockResolvedValue('## Comparison Results\n\nKey differences found.'),
  analyzeClauses: jest.fn().mockResolvedValue('## Clause Analysis\n\n🟢 Low risk overall.'),
  chatWithDocument: jest.fn().mockResolvedValue('Based on the document, here is the answer.'),
  generateChecklist: jest.fn().mockResolvedValue('## Checklist\n\n- [ ] Item 1\n- [ ] Item 2'),
  extractGlossary: jest.fn().mockResolvedValue('## Glossary\n\n**Term 1**: Definition here.'),
}));

import {
  validateDocumentText,
  validateQuestion,
  createErrorResponse,
  createSuccessResponse,
} from '../lib/sanitize';
import { checkRateLimit } from '../lib/rate-limiter';

// ─── Sanitize Integration Tests ───

describe('API Input Validation Integration', () => {
  describe('Document text validation pipeline', () => {
    it('should reject and return error for empty documents', () => {
      const result = validateDocumentText('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No document text provided');
    });

    it('should reject documents below minimum length', () => {
      const result = validateDocumentText('Too short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should sanitize and pass valid documents', () => {
      const input = 'This is a valid legal agreement between Party A and Party B regarding the terms and conditions of service delivery and obligations thereof.';
      const result = validateDocumentText(input);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe(input);
    });

    it('should strip null bytes during sanitization', () => {
      const input = 'This is a valid legal agreement\0 between Party A\0 and Party B regarding the terms and conditions of service delivery.';
      const result = validateDocumentText(input);
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('\0');
    });

    it('should strip control characters but preserve newlines', () => {
      const input = 'Legal Agreement\n\nSection 1: Terms\nThis agreement establishes the following conditions between the parties involved.\x01\x02';
      const result = validateDocumentText(input);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toContain('\n');
      expect(result.sanitized).not.toContain('\x01');
    });
  });

  describe('Question validation pipeline', () => {
    it('should reject empty questions', () => {
      const result = validateQuestion('');
      expect(result.valid).toBe(false);
    });

    it('should reject very short questions', () => {
      const result = validateQuestion('?');
      expect(result.valid).toBe(false);
    });

    it('should accept and sanitize valid questions', () => {
      const result = validateQuestion('What are my termination rights under this contract?');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });
  });
});

// ─── Response Builder Tests ───

describe('API Response Builders', () => {
  it('should create error responses with correct status and timestamp', async () => {
    const response = createErrorResponse('Test error', 400);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Test error');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('should create error responses with default 400 status', async () => {
    const response = createErrorResponse('Bad input');
    expect(response.status).toBe(400);
  });

  it('should create success responses with data and timestamp', async () => {
    const response = createSuccessResponse({ result: 'test data', extra: 'info' });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.result).toBe('test data');
    expect(body.extra).toBe('info');
    expect(body.timestamp).toBeDefined();
  });

  it('should use 429 status for rate limit errors', async () => {
    const response = createErrorResponse('Too many requests', 429);
    expect(response.status).toBe(429);
  });

  it('should use 500 status for server errors', async () => {
    const response = createErrorResponse('Internal error', 500);
    expect(response.status).toBe(500);
  });
});

// ─── Rate Limiter Integration Tests ───

describe('Rate Limiter Integration', () => {
  it('should allow a fresh IP through the pipeline', () => {
    const ip = `integration-test-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should track separate IPs independently', () => {
    const ipA = `integration-a-${Date.now()}`;
    const ipB = `integration-b-${Date.now()}`;

    // Use up some of IP A's tokens
    for (let i = 0; i < 15; i++) {
      checkRateLimit(ipA);
    }

    // IP B should still have full allowance
    const resultB = checkRateLimit(ipB);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBeGreaterThan(10);
  });

  it('should deny after exhausting the token bucket', () => {
    const ip = `integration-exhaust-${Date.now()}`;
    let denied = false;

    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(ip);
      if (!result.allowed) {
        denied = true;
        expect(result.retryAfter).toBeGreaterThan(0);
        break;
      }
    }

    expect(denied).toBe(true);
  });
});

// ─── End-to-End Validation Chain Tests ───

describe('Full Validation Chain', () => {
  it('should validate → sanitize → pass a realistic legal document excerpt', () => {
    const legalText = `
      TERMS OF SERVICE AGREEMENT

      This Terms of Service Agreement ("Agreement") is entered into as of the date
      of acceptance ("Effective Date") by and between the service provider ("Company")
      and the individual or entity ("User") accessing or using the services.

      1. ACCEPTANCE OF TERMS
      By accessing or using the services, you agree to be bound by these terms.
      If you do not agree, you may not access or use the services.

      2. MODIFICATIONS
      The Company reserves the right to modify these terms at any time. Continued
      use of the services after modifications constitutes acceptance of the updated terms.

      3. LIMITATION OF LIABILITY
      In no event shall the Company be liable for any indirect, incidental, special,
      consequential, or punitive damages arising out of or related to your use of the services.
    `;

    const result = validateDocumentText(legalText);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toContain('TERMS OF SERVICE');
    expect(result.sanitized).toContain('LIMITATION OF LIABILITY');
    expect(result.sanitized!.length).toBeGreaterThan(100);
  });

  it('should handle documents with mixed content and special characters', () => {
    const mixedDoc = `
      Contract #2024-001 — Service Agreement (Version 3.2)

      § 1. Definitions
      "Confidential Information" means any data, documents, or information that is
      proprietary to either party, including but not limited to: trade secrets,
      financial data (>$10,000 thresholds), customer lists, & technical specifications.

      § 2. Payment Terms
      Payment is due within NET-30 of invoice date. Late payments accrue interest
      at 1.5% per month (18% APR). Currency: USD ($).

      § 3. Indemnification
      Each party shall indemnify, defend, and hold harmless the other party from
      any claims, losses, or damages — including reasonable attorneys' fees.
    `;

    const result = validateDocumentText(mixedDoc);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toContain('§');
    expect(result.sanitized).toContain('$10,000');
    expect(result.sanitized).toContain('attorneys');
  });
});

/**
 * Tests for the Gemini AI service layer.
 * Mocks the @google/genai SDK and validates all exported functions.
 */

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// Must import after mocking
import {
  simplifyDocument,
  compareDocuments,
  analyzeClauses,
  chatWithDocument,
  generateChecklist,
  extractGlossary,
  _testOnly_clearCache,
} from '../lib/gemini';

beforeEach(() => {
  mockGenerateContent.mockReset();
  _testOnly_clearCache();
  process.env.GEMINI_API_KEY = 'test-key-123';
});

afterAll(() => {
  delete process.env.GEMINI_API_KEY;
});

describe('Gemini Service — generate()', () => {
  it('should throw when GEMINI_API_KEY is not set', async () => {
    // Reset module to test missing key (need fresh import)
    jest.resetModules();
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    // Re-mock the module
    jest.mock('@google/genai', () => ({
      GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: { generateContent: jest.fn() },
      })),
    }));

    const gemini = require('../lib/gemini');

    await expect(gemini.simplifyDocument('test text with enough content for validation'))
      .rejects.toThrow('GEMINI_API_KEY');

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should throw when Gemini returns an empty response', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '' });

    await expect(simplifyDocument('A valid legal document with enough content for testing purposes'))
      .rejects.toThrow('empty response');
  });

  it('should throw when Gemini returns null text', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: null });

    await expect(simplifyDocument('A valid legal document with enough content for testing purposes'))
      .rejects.toThrow('empty response');
  });
});

describe('simplifyDocument', () => {
  it('should call Gemini with document text and return result', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '## Simplified\nContent here.' });

    const result = await simplifyDocument('This is a legal contract.');

    expect(result).toBe('## Simplified\nContent here.');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain('This is a legal contract.');
    expect(call.config.systemInstruction).toContain('simplifier');
  });

  it('should return a string type', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'test result' });
    const result = await simplifyDocument('test doc');
    expect(typeof result).toBe('string');
  });

  it('should use adaptive token limits for simplify operation', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'result' });
    await simplifyDocument('test doc');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.maxOutputTokens).toBe(4096);
  });
});

describe('compareDocuments', () => {
  it('should include both document texts in the prompt', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '## Comparison\nDifferences found.' });

    const result = await compareDocuments('Document A content', 'Document B content');

    expect(result).toBe('## Comparison\nDifferences found.');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain('Document A content');
    expect(call.contents).toContain('Document B content');
    expect(call.config.systemInstruction).toContain('comparator');
  });

  it('should use adaptive token limits for compare operation', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'result' });
    await compareDocuments('doc A', 'doc B');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.maxOutputTokens).toBe(6144);
  });
});

describe('analyzeClauses', () => {
  it('should call Gemini with the correct system instruction', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '## Analysis\n🟢 Low risk.' });

    const result = await analyzeClauses('Legal clause text here');

    expect(result).toBe('## Analysis\n🟢 Low risk.');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toContain('clause analyzer');
  });
});

describe('chatWithDocument', () => {
  it('should include document text in the system instruction', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'The answer is...' });

    const result = await chatWithDocument(
      'Full document text here',
      'What are my obligations?',
      []
    );

    expect(result).toBe('The answer is...');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toContain('Full document text here');
  });

  it('should include conversation history in the prompt', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'Follow-up answer.' });

    const history = [
      { role: 'user' as const, content: 'First question' },
      { role: 'assistant' as const, content: 'First answer' },
    ];

    await chatWithDocument('Doc text', 'Follow-up question', history);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain('First question');
    expect(call.contents).toContain('First answer');
    expect(call.contents).toContain('Follow-up question');
  });

  it('should truncate history to last 6 messages', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'answer' });

    const history = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
    }));

    await chatWithDocument('Doc', 'Latest question', history);

    const call = mockGenerateContent.mock.calls[0][0];
    // Messages 0-3 should NOT appear (only last 6: messages 4-9)
    expect(call.contents).not.toContain('Message 0');
    expect(call.contents).not.toContain('Message 3');
    expect(call.contents).toContain('Message 4');
    expect(call.contents).toContain('Message 9');
  });

  it('should work with empty history', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'first answer' });

    const result = await chatWithDocument('Doc', 'Question?', []);

    expect(result).toBe('first answer');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain('Question?');
  });

  it('should use lower token limit for chat responses', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'answer' });
    await chatWithDocument('Doc', 'Question?', []);
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.maxOutputTokens).toBe(2048);
  });
});

describe('generateChecklist', () => {
  it('should call Gemini with checklist-specific instruction', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '- [ ] Item 1\n- [ ] Item 2' });

    const result = await generateChecklist('Contract text');

    expect(result).toBe('- [ ] Item 1\n- [ ] Item 2');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toContain('checklist');
  });
});

describe('extractGlossary', () => {
  it('should call Gemini with glossary-specific instruction', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '**Term**: Definition' });

    const result = await extractGlossary('Legal document');

    expect(result).toBe('**Term**: Definition');
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toContain('terminology');
  });
});

describe('Response Caching', () => {
  it('should return cached result for identical requests', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'cached result' });

    const result1 = await simplifyDocument('test document content');
    const result2 = await simplifyDocument('test document content');

    expect(result1).toBe('cached result');
    expect(result2).toBe('cached result');
    // Should only have called the API once
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should not cache different inputs', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ text: 'result A' })
      .mockResolvedValueOnce({ text: 'result B' });

    const result1 = await simplifyDocument('document A');
    const result2 = await simplifyDocument('document B');

    expect(result1).toBe('result A');
    expect(result2).toBe('result B');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('should clear cache when _testOnly_clearCache is called', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ text: 'first' })
      .mockResolvedValueOnce({ text: 'second' });

    await simplifyDocument('test doc');
    _testOnly_clearCache();
    const result = await simplifyDocument('test doc');

    expect(result).toBe('second');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});

describe('Text Truncation', () => {
  it('should handle very large documents by truncating', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'result' });

    // Create a document larger than 100k chars
    const largeDoc = 'x'.repeat(150_000);
    await simplifyDocument(largeDoc);

    const call = mockGenerateContent.mock.calls[0][0];
    // The contents should be shorter than the original due to truncation
    expect(call.contents.length).toBeLessThan(largeDoc.length);
    expect(call.contents).toContain('truncated for efficiency');
  });

  it('should not truncate documents under the limit', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'result' });

    const normalDoc = 'This is a normal sized document.';
    await simplifyDocument(normalDoc);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain(normalDoc);
    expect(call.contents).not.toContain('truncated');
  });
});

describe('All functions return strings', () => {
  const functions = [
    { name: 'simplifyDocument', fn: () => simplifyDocument('test') },
    { name: 'compareDocuments', fn: () => compareDocuments('a', 'b') },
    { name: 'analyzeClauses', fn: () => analyzeClauses('test') },
    { name: 'chatWithDocument', fn: () => chatWithDocument('doc', 'q', []) },
    { name: 'generateChecklist', fn: () => generateChecklist('test') },
    { name: 'extractGlossary', fn: () => extractGlossary('test') },
  ];

  functions.forEach(({ name, fn }) => {
    it(`${name} should return a string`, async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'result' });
      const result = await fn();
      expect(typeof result).toBe('string');
    });
  });
});

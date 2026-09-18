'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import DisclaimerBanner from '@/components/DisclaimerBanner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Lightweight Markdown→HTML for chat bubbles.
 */
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&gt; /gm, '> ');

  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p><(h[1-4]|ul|ol|li|blockquote|hr)/g, '<$1');
  html = html.replace(/<\/(h[1-4]|ul|ol|li|blockquote)><\/p>/g, '</$1>');

  return html;
}

export default function ChatPage() {
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !documentText || isLoading) return;

    const question = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          question,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a response.');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.result,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, documentText, isLoading, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <div className="container page-wrapper">
      <div className="page-title-section">
        <h1>
          <span aria-hidden="true">💬</span>
          Legal Q&A Chat
        </h1>
        <p>
          Upload a document and ask questions about it in natural language.
          Get contextual AI answers based on the document content.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Document upload phase */}
      {!documentText && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="section-label">
            <span aria-hidden="true">📤</span>
            Step 1: Load Your Document
          </div>
          <div className="glass-panel">
            <DocumentUploader
              onTextReady={(text) => {
                setDocumentText(text);
                setMessages([
                  {
                    role: 'assistant',
                    content:
                      "I've loaded your document! I'm ready to answer questions about it. What would you like to know?\n\nHere are some things you can ask:\n- **\"What are my main obligations?\"**\n- **\"Are there any concerning clauses?\"**\n- **\"What happens if I want to terminate?\"**\n- **\"Summarize the payment terms\"**\n- **\"What are the privacy implications?\"**",
                  },
                ]);
              }}
              label="Legal Document"
              placeholder="Paste the legal document you want to discuss..."
              id="chat-doc"
            />
          </div>
        </div>
      )}

      {/* Chat phase */}
      {documentText && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="chat-container">
            {/* Document loaded indicator */}
            <div
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(16, 185, 129, 0.05)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-emerald)' }}>
                ✅ Document loaded ({documentText.length.toLocaleString()} characters)
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setDocumentText(null);
                  setMessages([]);
                  setInput('');
                }}
              >
                📄 Load Different Document
              </button>
            </div>

            {/* Messages */}
            <div
              className="chat-messages"
              role="log"
              aria-label="Chat messages"
              aria-live="polite"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message chat-message--${msg.role}`}
                >
                  <div
                    className={`chat-avatar chat-avatar--${msg.role}`}
                    aria-hidden="true"
                  >
                    {msg.role === 'user' ? '👤' : '⚖️'}
                  </div>
                  <div
                    className="chat-bubble"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.content),
                    }}
                  />
                </div>
              ))}

              {isLoading && (
                <div className="chat-message chat-message--assistant">
                  <div className="chat-avatar chat-avatar--assistant" aria-hidden="true">
                    ⚖️
                  </div>
                  <div className="chat-bubble">
                    <span className="loading-text">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: 'var(--space-sm) var(--space-lg)',
                  background: 'rgba(244, 63, 94, 0.05)',
                  borderTop: '1px solid rgba(244, 63, 94, 0.2)',
                  fontSize: '0.8rem',
                  color: 'var(--color-accent-rose)',
                }}
                role="alert"
              >
                ❌ {error}
              </div>
            )}

            {/* Input area */}
            <div className="chat-input-area">
              <label htmlFor="chat-input" className="sr-only">
                Ask a question about the document
              </label>
              <input
                ref={inputRef}
                id="chat-input"
                className="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your document..."
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading ? '⏳' : '📨'} Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

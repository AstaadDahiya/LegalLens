'use client';

import { useState, useCallback } from 'react';
import type { Metadata } from 'next';
import DocumentUploader from '@/components/DocumentUploader';
import ResultPanel from '@/components/ResultPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import DisclaimerBanner from '@/components/DisclaimerBanner';

export default function SimplifyPage() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextReady = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to simplify document.');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="container page-wrapper">
      <div className="page-title-section">
        <h1>
          <span aria-hidden="true">📄</span>
          Document Simplifier
        </h1>
        <p>
          Upload a legal document and get a clear, plain-English explanation of what it says,
          including key points, your rights, and important terms.
        </p>
      </div>

      <DisclaimerBanner />

      <div className="tool-layout">
        <div className="tool-input-section">
          <div className="section-label">
            <span aria-hidden="true">📤</span>
            Input Document
          </div>
          <div className="glass-panel">
            <DocumentUploader
              onTextReady={handleTextReady}
              label="Legal Document"
              placeholder="Paste your legal document, contract, terms of service, or policy here..."
              disabled={isLoading}
              id="simplify-doc"
            />
          </div>
        </div>

        <div>
          <div className="section-label">
            <span aria-hidden="true">📊</span>
            Analysis Results
          </div>
          {isLoading && (
            <LoadingSpinner message="Simplifying your document with AI..." />
          )}
          {error && (
            <div className="disclaimer-banner" role="alert" style={{
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.05)',
            }}>
              <span className="disclaimer-icon" aria-hidden="true">❌</span>
              <span className="disclaimer-text">{error}</span>
            </div>
          )}
          {result && (
            <ResultPanel
              content={result}
              title="Simplified Document"
              icon="📄"
            />
          )}
          {!isLoading && !result && !error && (
            <div className="glass-panel empty-state">
              <span className="empty-state-icon" aria-hidden="true">📄</span>
              <h3>No document analyzed yet</h3>
              <p>Upload or paste a legal document to see it simplified in plain English.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

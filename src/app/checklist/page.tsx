'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import ResultPanel from '@/components/ResultPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import DisclaimerBanner from '@/components/DisclaimerBanner';

export default function ChecklistPage() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: cancel in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleTextReady = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate checklist.');
      }

      setResult(data.result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="container page-wrapper">
      <div className="page-title-section">
        <h1>
          <span aria-hidden="true">✅</span>
          Checklist Generator
        </h1>
        <p>
          Generate actionable checklists from your legal documents. Track obligations,
          deadlines, compliance requirements, and items to verify.
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
              placeholder="Paste your contract or agreement here to generate checklists..."
              disabled={isLoading}
              id="checklist-doc"
            />
          </div>
        </div>

        <div>
          <div className="section-label">
            <span aria-hidden="true">📊</span>
            Generated Checklists
          </div>
          {isLoading && (
            <LoadingSpinner message="Generating checklists with AI..." />
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
              title="Action Checklists"
              icon="✅"
            />
          )}
          {!isLoading && !result && !error && (
            <div className="glass-panel empty-state">
              <span className="empty-state-icon" aria-hidden="true">✅</span>
              <h3>No checklist generated yet</h3>
              <p>Upload or paste a legal document to generate actionable checklists with obligations and deadlines.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

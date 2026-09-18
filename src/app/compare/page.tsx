'use client';

import { useState, useCallback } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import ResultPanel from '@/components/ResultPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import DisclaimerBanner from '@/components/DisclaimerBanner';

export default function ComparePage() {
  const [textA, setTextA] = useState<string | null>(null);
  const [textB, setTextB] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = useCallback(async () => {
    if (!textA || !textB) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textA, textB }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare documents.');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [textA, textB]);

  return (
    <div className="container page-wrapper">
      <div className="page-title-section">
        <h1>
          <span aria-hidden="true">⚖️</span>
          Contract Comparator
        </h1>
        <p>
          Upload two legal documents to get a detailed side-by-side comparison of differences,
          risks, and missing provisions.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Two-column upload area */}
      <div className="comparison-grid mb-lg">
        <div className="comparison-column">
          <span className="comparison-label comparison-label--a">
            <span aria-hidden="true">📄</span>
            Document A
          </span>
          <div className="glass-panel">
            <DocumentUploader
              onTextReady={(text) => setTextA(text)}
              label="Document A"
              placeholder="Paste the first legal document here..."
              disabled={isLoading}
              id="compare-doc-a"
            />
            {textA && (
              <div className="file-info mt-md" role="status">
                <span className="file-info-icon" aria-hidden="true">✅</span>
                <div className="file-info-details">
                  <div className="file-info-name">Document A loaded</div>
                  <div className="file-info-size">
                    {textA.length.toLocaleString()} characters
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="comparison-column">
          <span className="comparison-label comparison-label--b">
            <span aria-hidden="true">📄</span>
            Document B
          </span>
          <div className="glass-panel">
            <DocumentUploader
              onTextReady={(text) => setTextB(text)}
              label="Document B"
              placeholder="Paste the second legal document here..."
              disabled={isLoading}
              id="compare-doc-b"
            />
            {textB && (
              <div className="file-info mt-md" role="status">
                <span className="file-info-icon" aria-hidden="true">✅</span>
                <div className="file-info-details">
                  <div className="file-info-name">Document B loaded</div>
                  <div className="file-info-size">
                    {textB.length.toLocaleString()} characters
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare button */}
      <div className="text-center mb-lg">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleCompare}
          disabled={!textA || !textB || isLoading}
          aria-label="Compare both documents"
        >
          {isLoading ? '⏳ Comparing...' : '⚖️ Compare Documents'}
        </button>
        {(!textA || !textB) && (
          <p className="mt-sm" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Upload both documents to enable comparison
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading && (
        <LoadingSpinner message="Comparing your documents with AI..." />
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
          title="Comparison Results"
          icon="⚖️"
        />
      )}
    </div>
  );
}

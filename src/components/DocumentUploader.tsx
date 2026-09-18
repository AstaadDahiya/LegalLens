'use client';

import { useState, useCallback, useRef } from 'react';

interface DocumentUploaderProps {
  /** Called with the extracted text content */
  onTextReady: (text: string) => void;
  /** Label for this uploader instance */
  label?: string;
  /** Placeholder text for the paste area */
  placeholder?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Unique ID prefix for accessibility */
  id?: string;
}

export default function DocumentUploader({
  onTextReady,
  label = 'Document',
  placeholder = 'Paste your legal document text here...',
  disabled = false,
  id = 'doc',
}: DocumentUploaderProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Handle text files directly
        const text = await file.text();
        setFileName(file.name);
        setFileSize(file.size);
        onTextReady(text);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Send PDF to server for parsing
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse PDF.');
        }

        setFileName(file.name);
        setFileSize(file.size);
        onTextReady(data.text);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or text file.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process file.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [onTextReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, isProcessing, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim().length > 0) {
      setError(null);
      onTextReady(pasteText.trim());
    }
  }, [pasteText, onTextReady]);

  const removeFile = useCallback(() => {
    setFileName(null);
    setFileSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="uploader">
      {/* Input mode toggle */}
      <div className="input-toggle" role="tablist" aria-label={`${label} input method`}>
        <button
          className={`toggle-btn ${inputMode === 'upload' ? 'active' : ''}`}
          onClick={() => setInputMode('upload')}
          disabled={disabled}
          role="tab"
          aria-selected={inputMode === 'upload'}
          aria-controls={`${id}-upload-panel`}
          id={`${id}-upload-tab`}
        >
          📁 Upload File
        </button>
        <button
          className={`toggle-btn ${inputMode === 'paste' ? 'active' : ''}`}
          onClick={() => setInputMode('paste')}
          disabled={disabled}
          role="tab"
          aria-selected={inputMode === 'paste'}
          aria-controls={`${id}-paste-panel`}
          id={`${id}-paste-tab`}
        >
          📋 Paste Text
        </button>
      </div>

      {/* Upload mode */}
      {inputMode === 'upload' && (
        <div
          id={`${id}-upload-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-upload-tab`}
        >
          <div
            className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={`Upload ${label}. Drag and drop or click to browse.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <span className="upload-icon" aria-hidden="true">
              {isProcessing ? '⏳' : '📤'}
            </span>
            <h3>{isProcessing ? 'Processing...' : `Upload ${label}`}</h3>
            <p>
              Drag & drop your file here, or{' '}
              <span className="upload-label">browse files</span>
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
              Supports PDF and TXT files (max 5 MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.text"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            aria-label={`Select ${label} file`}
            id={`${id}-file-input`}
            disabled={disabled || isProcessing}
          />

          {/* File info badge */}
          {fileName && (
            <div className="file-info" role="status">
              <span className="file-info-icon" aria-hidden="true">📎</span>
              <div className="file-info-details">
                <div className="file-info-name">{fileName}</div>
                <div className="file-info-size">
                  {(fileSize / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                className="file-info-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                aria-label={`Remove ${fileName}`}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paste mode */}
      {inputMode === 'paste' && (
        <div
          id={`${id}-paste-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-paste-tab`}
        >
          <label htmlFor={`${id}-textarea`} className="sr-only">
            {placeholder}
          </label>
          <textarea
            id={`${id}-textarea`}
            className="text-input-area"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            rows={10}
            aria-describedby={`${id}-char-count`}
          />
          <div className="char-count" id={`${id}-char-count`}>
            {pasteText.length.toLocaleString()} characters
          </div>
          <button
            className="btn btn-primary mt-md"
            onClick={handlePasteSubmit}
            disabled={disabled || isProcessing || pasteText.trim().length === 0}
            style={{ width: '100%' }}
          >
            {isProcessing ? '⏳ Processing...' : '🔍 Analyze Text'}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          className="disclaimer-banner mt-md"
          role="alert"
          style={{
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.05)',
          }}
        >
          <span className="disclaimer-icon" aria-hidden="true">❌</span>
          <span className="disclaimer-text">{error}</span>
        </div>
      )}
    </div>
  );
}

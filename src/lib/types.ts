/**
 * Shared type definitions for LegalLens.
 * Centralizes all types used across the application for consistency.
 */

// ─── API Response Types ───

/** Standard success response from all API routes */
export interface ApiSuccessResponse {
  result: string;
  timestamp: string;
}

/** Standard error response from all API routes */
export interface ApiErrorResponse {
  error: string;
  timestamp: string;
}

/** Response from the PDF parsing endpoint */
export interface PdfParseResponse {
  text: string;
  numPages: number;
  info: PdfMetadata;
  timestamp: string;
}

/** PDF document metadata */
export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
}

// ─── Chat Types ───

/** A single message in the Q&A chat conversation */
export interface ChatMessage {
  /** The role of the message sender */
  role: 'user' | 'assistant';
  /** The text content of the message */
  content: string;
}

/** Request payload for the chat API */
export interface ChatRequest {
  documentText: string;
  question: string;
  history: ChatMessage[];
}

// ─── Analysis Types ───

/** Risk level for clause analysis */
export type RiskLevel = 'low' | 'medium' | 'high';

/** Clause category for the analyzer */
export type ClauseCategory =
  | 'Obligation'
  | 'Right'
  | 'Restriction'
  | 'Liability'
  | 'Termination'
  | 'Payment'
  | 'Confidentiality'
  | 'Indemnification'
  | 'Warranty'
  | 'Dispute Resolution'
  | 'Intellectual Property'
  | 'Data Privacy'
  | 'Force Majeure'
  | 'Amendment'
  | 'General';

// ─── Document Input Types ───

/** The input mode for document uploaders */
export type InputMode = 'upload' | 'paste';

/** Validation result returned by sanitization utilities */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/** File validation result */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Feature Page Types ───

/** Props common to all tool pages */
export interface ToolPageState {
  result: string | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Rate Limiter Types ───

/** Result of a rate limit check */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining tokens */
  remaining: number;
  /** Seconds until the client can retry (only when denied) */
  retryAfter?: number;
}

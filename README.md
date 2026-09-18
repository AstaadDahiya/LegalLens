# 🔍 LegalLens — AI-Powered Legal Document Assistant

> **Making legal documents actually understandable.** Upload any legal document and get instant AI-powered analysis — simplified summaries, clause breakdowns, contract comparisons, and more.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini%20AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📋 Table of Contents

- [Chosen Vertical](#-chosen-vertical)
- [Approach & Logic](#-approach--logic)
- [How It Works](#-how-it-works)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Accessibility](#-accessibility)
- [Testing](#-testing)
- [Assumptions & Limitations](#-assumptions--limitations)
- [Legal Disclaimer](#-legal-disclaimer)

---

## 🎯 Chosen Vertical

**Legal Information & Assistance** — Building a GenAI-powered solution that makes legal information and basic legal assistance more accessible by helping users understand, compare, and navigate legal documents and information.

---

## 🧠 Approach & Logic

### Problem Statement
Legal documents are inherently complex, filled with jargon, and difficult for non-lawyers to understand. This creates a significant barrier to access — people sign contracts, agree to terms, and enter legal obligations without fully understanding what they're committing to.

### Solution Philosophy
LegalLens takes a **privacy-first, informational assistance** approach:

1. **No Data Storage**: Documents are processed entirely in-memory and never persisted to any database or file system. Once the analysis is complete, the document text exists only in the user's browser session.

2. **AI-Powered Analysis**: We leverage Google Gemini 2.0 Flash for its speed and reasoning capabilities. Each feature uses carefully crafted system prompts that instruct the AI to:
   - Use plain language (6th-grade reading level)
   - Always disclaim that outputs are not legal advice
   - Provide structured, actionable output
   - Flag concerning clauses and risks

3. **Multi-Angle Analysis**: Rather than a single "summarize" button, LegalLens provides 6 distinct analysis tools that each approach the document from a different angle, giving users a comprehensive understanding.

4. **Contextual Chat**: The Q&A chat feature allows users to ask follow-up questions about their documents, maintaining conversation context for deeper exploration.

### Decision-Making Logic
- **Input Routing**: The app accepts both PDF uploads (server-side parsing with `pdf-parse`) and direct text paste, with automatic format detection.
- **Rate Limiting**: Token bucket algorithm protects the API from abuse while allowing burst requests for legitimate use.
- **Error Handling**: Graceful degradation with specific, actionable error messages (e.g., "This PDF appears to be scanned — try pasting the text directly").
- **Prompt Engineering**: Each feature has a tailored system prompt that produces structured, consistent output optimized for readability.

---

## ⚙️ How It Works

```
User uploads/pastes document
         │
         ▼
  ┌──────────────────┐
  │ Input Validation  │ ← File type, size, content sanitization
  │ & Sanitization    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  PDF Parser       │ ← Extracts text from PDF (server-side)
  │  (if PDF upload)  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Rate Limiter     │ ← Token bucket algorithm, per-IP
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Gemini AI        │ ← Feature-specific system prompt
  │  (2.0 Flash)      │   + document text → structured analysis
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Result Rendering │ ← Markdown → HTML rendering
  │  & Display        │   with copy/download options
  └──────────────────┘
```

1. **Upload/Paste**: User provides a legal document via drag-and-drop file upload or text paste.
2. **Parsing**: If a PDF is uploaded, it's sent to the server for text extraction using `pdf-parse`. Text input is used directly.
3. **Validation**: All inputs are sanitized (null bytes, control characters removed) and validated (length limits, file size checks).
4. **Rate Limiting**: Requests are rate-limited using a token bucket algorithm (20 requests/burst, 2 tokens/second refill).
5. **AI Processing**: The document text is sent to Google Gemini with a feature-specific system prompt. Each prompt is engineered to produce structured, readable output.
6. **Display**: Results are rendered as formatted content with options to copy to clipboard or download as Markdown files.

---

## ✨ Features

### 1. 📄 Document Simplifier
Transform complex legal language into plain English. Get:
- Document type identification
- Clear, jargon-free summary
- Key points and takeaways
- Your rights and obligations explained
- Important dates and deadlines
- Potential concerns flagged

### 2. ⚖️ Contract Comparator
Upload two documents for side-by-side comparison:
- Key differences by topic/clause area
- Impact assessment for each difference
- Risk comparison from different perspectives
- Missing provisions in either document
- Recommendations for professional review

### 3. 🔍 Clause Analyzer
Deep-dive into every clause with:
- Automatic clause extraction and categorization
- Risk ratings (🟢 Low / 🟡 Medium / 🔴 High)
- Plain English explanations
- Key implications for each party
- Overall risk summary
- Missing protection alerts

### 4. 💬 Legal Q&A Chat
Interactive conversation about your document:
- Natural language question support
- Contextual answers based on document content
- Conversation history for follow-up questions
- Suggestions for questions to ask
- Professional review recommendations

### 5. ✅ Checklist Generator
Actionable checklists from legal documents:
- Immediate actions required
- Ongoing obligations
- Key deadlines and dates
- Compliance requirements
- Documents to maintain
- Items to verify before signing

### 6. 📖 Legal Glossary
Identify and explain legal terminology:
- Every legal term found in the document
- Plain English definitions with examples
- Categorized by topic area
- Context showing where each term appears
- Quick reference table

---

## 🏗 Architecture

```
legallens/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # Server-side API routes
│   │   │   ├── analyze/        # Clause analysis endpoint
│   │   │   ├── chat/           # Q&A chat endpoint
│   │   │   ├── checklist/      # Checklist generation endpoint
│   │   │   ├── compare/        # Document comparison endpoint
│   │   │   ├── glossary/       # Glossary extraction endpoint
│   │   │   ├── parse-pdf/      # PDF upload & parsing endpoint
│   │   │   └── simplify/       # Document simplification endpoint
│   │   ├── analyze/            # Clause analyzer page
│   │   ├── chat/               # Q&A chat page
│   │   ├── checklist/          # Checklist generator page
│   │   ├── compare/            # Contract comparator page
│   │   ├── glossary/           # Legal glossary page
│   │   ├── simplify/           # Document simplifier page
│   │   ├── globals.css         # Complete design system
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable UI components
│   │   ├── DisclaimerBanner.tsx
│   │   ├── DocumentUploader.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ResultPanel.tsx
│   ├── lib/                    # Core logic
│   │   ├── gemini.ts           # Gemini AI client + prompts
│   │   ├── pdf-parser.ts       # PDF text extraction
│   │   ├── rate-limiter.ts     # Token bucket rate limiter
│   │   └── sanitize.ts         # Input validation & sanitization
│   └── __tests__/              # Test suite
│       ├── rate-limiter.test.ts
│       └── sanitize.test.ts
├── .env.example                # Environment variable template
├── .gitignore
├── jest.config.js
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React with SSR and API routes |
| **Language** | TypeScript 5 | Type safety and developer experience |
| **AI** | Google Gemini 2.0 Flash | Fast, capable generative AI model |
| **AI SDK** | @google/genai | Official Google Gen AI Node.js SDK |
| **PDF Parsing** | pdf-parse | Server-side PDF text extraction |
| **Styling** | Vanilla CSS | Custom properties, glassmorphism, animations |
| **Testing** | Jest + ts-jest | Unit and integration testing |
| **Linting** | ESLint | Code quality enforcement |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ (22+ recommended)
- **npm** 9+
- **Google Gemini API key** — [Get one free](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/legallens.git
   cd legallens
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Security

LegalLens implements multiple layers of security:

| Measure | Implementation |
|---------|---------------|
| **API Key Protection** | Gemini API key is stored server-side only in `.env.local`, never exposed to the client |
| **Input Sanitization** | All text inputs are sanitized to remove null bytes, control characters, and malicious content |
| **File Validation** | Uploaded files are validated for type (PDF/TXT only) and size (max 5 MB) |
| **Rate Limiting** | Token bucket algorithm (20 burst / 2 per second refill) per IP address to prevent abuse |
| **No Data Persistence** | Documents are processed in-memory and never stored to disk or database |
| **Error Handling** | Server errors return safe, generic messages without leaking internal details |
| **Content Security** | HTML rendering uses a lightweight Markdown parser rather than `eval` or raw HTML injection |

---

## ♿ Accessibility

LegalLens is designed to meet **WCAG 2.1 AA** standards:

- **Semantic HTML**: Proper use of `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>` elements
- **Skip Navigation**: "Skip to main content" link for keyboard users
- **ARIA Labels**: All interactive elements have descriptive `aria-label` attributes
- **ARIA Roles**: Navigation, status, alert, log, and other roles properly assigned
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: `sr-only` class for screen-reader-only content, `aria-live` regions for dynamic updates
- **Color Contrast**: All text meets minimum 4.5:1 contrast ratio against backgrounds
- **Focus States**: Custom `:focus-visible` styles with 2px solid outlines
- **Responsive Design**: Fully responsive layout from mobile to desktop
- **Tab Panels**: Document uploader uses proper ARIA tab pattern

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| `sanitize.ts` | Input sanitization, text validation, question validation | Core logic |
| `rate-limiter.ts` | Token bucket, burst handling, IP independence, retry-after | Security |

### Build Verification
```bash
# Type checking + build
npm run build

# Linting
npm run lint
```

---

## 📝 Assumptions & Limitations

### Assumptions
1. **Digital PDFs**: PDF parsing works with digitally-created PDFs. Scanned/image-based PDFs are not supported (no OCR).
2. **English Language**: The AI prompts and analysis are optimized for English-language legal documents.
3. **Document Size**: Documents up to 500,000 characters (~100 pages) are supported. Larger documents should be split into sections.
4. **API Availability**: Requires an active internet connection and a valid Google Gemini API key.
5. **Single User**: The in-memory rate limiter is designed for single-instance deployments.

### Limitations
1. **Not Legal Advice**: Outputs are AI-generated and may contain errors, omissions, or misinterpretations. Always consult a qualified attorney.
2. **No OCR**: Scanned or image-based PDFs cannot be processed. Users must paste text manually.
3. **Context Length**: Very long documents may be truncated by the AI model's context window.
4. **No Document Storage**: Documents are not saved between sessions. Users must re-upload for new analysis.
5. **AI Accuracy**: While Gemini 2.0 Flash is highly capable, AI analysis may not capture nuances that a human lawyer would identify.

---

## ⚖️ Legal Disclaimer

> **LegalLens is an AI-powered informational tool.** It does NOT provide legal advice, and its outputs should NOT be treated as a substitute for consultation with a qualified attorney or legal professional.
>
> The analysis, summaries, comparisons, and other outputs generated by LegalLens are produced by artificial intelligence and may contain errors, omissions, or misinterpretations. Users should independently verify all information and seek professional legal counsel before making any legal decisions.
>
> By using LegalLens, you acknowledge that:
> - AI-generated outputs are for informational purposes only
> - No attorney-client relationship is created
> - The developers of LegalLens are not liable for any decisions made based on the tool's outputs
> - You will seek professional legal advice for any legal matters

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ using <strong>Next.js</strong> and <strong>Google Gemini AI</strong></p>
  <p>
    <a href="https://nextjs.org/">Next.js</a> •
    <a href="https://ai.google.dev/">Google AI</a> •
    <a href="https://www.typescriptlang.org/">TypeScript</a>
  </p>
</div>

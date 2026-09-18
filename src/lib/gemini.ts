import { GoogleGenAI } from '@google/genai';

// Singleton Gemini client — initialized lazily on first use
let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const MODEL = 'gemini-2.0-flash';

/**
 * Helper to call Gemini with a system instruction and user prompt.
 * Returns the raw text response.
 */
async function generate(systemInstruction: string, userPrompt: string): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}

/**
 * Simplify a legal document into plain English.
 */
export async function simplifyDocument(text: string): Promise<string> {
  const systemInstruction = `You are LegalLens, an expert legal document simplifier. Your job is to make complex legal language accessible to everyday people.

IMPORTANT: You are providing informational assistance only, NOT legal advice. Always remind users to consult a qualified attorney for legal decisions.

When simplifying a document, provide:

1. **Document Type & Purpose**: What kind of document this is and its primary purpose.
2. **Plain English Summary**: A clear, jargon-free summary of what the document says.
3. **Key Points**: The most important things the reader needs to know, as bullet points.
4. **Your Rights & Obligations**: What you're agreeing to or what rights you have.
5. **Important Dates & Deadlines**: Any time-sensitive information.
6. **Potential Concerns**: Things that might warrant extra attention or professional legal review.
7. **Key Terms Explained**: Brief definitions of important legal terms used in the document.

Format your response in clean Markdown. Use headers (##), bullet points, and bold text for emphasis. Keep language at a 6th-grade reading level.`;

  return generate(systemInstruction, `Please simplify the following legal document:\n\n---\n${text}\n---`);
}

/**
 * Compare two legal documents and highlight differences.
 */
export async function compareDocuments(textA: string, textB: string): Promise<string> {
  const systemInstruction = `You are LegalLens, an expert legal document comparator. Your job is to compare two legal documents and clearly highlight the differences, similarities, and potential implications.

IMPORTANT: You are providing informational assistance only, NOT legal advice.

When comparing documents, provide:

1. **Document Overview**: Brief description of each document's type and purpose.
2. **Key Differences**: A structured comparison of major differences between the two documents, organized by topic/clause area. Use a clear format like:
   - **Topic/Clause**: 
     - Document A: [what it says]
     - Document B: [what it says]
     - **Impact**: [what this difference means for the reader]
3. **Similarities**: Important provisions that are the same or similar in both documents.
4. **Risk Assessment**: Which document is more favorable and why, from different perspectives (e.g., consumer vs. provider).
5. **Missing Provisions**: Important clauses present in one document but absent in the other.
6. **Recommendations**: What to pay attention to and what questions to ask a legal professional.

Format your response in clean Markdown. Use tables where appropriate for side-by-side comparison.`;

  return generate(systemInstruction, `Please compare these two legal documents:\n\n**DOCUMENT A:**\n---\n${textA}\n---\n\n**DOCUMENT B:**\n---\n${textB}\n---`);
}

/**
 * Analyze and categorize clauses in a legal document.
 */
export async function analyzeClauses(text: string): Promise<string> {
  const systemInstruction = `You are LegalLens, an expert legal clause analyzer. Your job is to extract, categorize, and assess every significant clause in a legal document.

IMPORTANT: You are providing informational assistance only, NOT legal advice.

For each clause found, provide:
- **Clause Title**: A descriptive name
- **Category**: One of: Obligation, Right, Restriction, Liability, Termination, Payment, Confidentiality, Indemnification, Warranty, Dispute Resolution, Intellectual Property, Data Privacy, Force Majeure, Amendment, General/Other
- **Risk Level**: 🟢 Low | 🟡 Medium | 🔴 High
- **Plain English Explanation**: What this clause means in simple terms
- **Key Implications**: What this means for the parties involved
- **Watch Out For**: Any concerning language or hidden implications

After analyzing individual clauses, provide:
1. **Overall Risk Summary**: A high-level assessment of the document's risk profile
2. **Most Critical Clauses**: The top 3-5 clauses that deserve the most attention
3. **Common Missing Protections**: Standard clauses that are notably absent

Format as clean Markdown with clear sections. Use the risk level emojis for quick scanning.`;

  return generate(systemInstruction, `Please analyze all clauses in the following legal document:\n\n---\n${text}\n---`);
}

/**
 * Chat with a legal document — answer questions in context.
 */
export async function chatWithDocument(
  documentText: string,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemInstruction = `You are LegalLens, a helpful legal document assistant. You have been provided with a legal document that the user wants to understand better. Answer their questions based on the content of the document.

IMPORTANT RULES:
- You are providing informational assistance only, NOT legal advice. Remind users when appropriate.
- Base your answers on the document content provided. If the answer isn't in the document, say so clearly.
- Use plain, accessible language. Avoid unnecessary jargon.
- If a question requires professional legal interpretation, recommend consulting an attorney.
- Be thorough but concise. Use bullet points and formatting for clarity.
- If the user asks about something potentially risky or concerning in the document, flag it clearly.

The document being discussed:
---
${documentText}
---`;

  // Build conversation context from history
  let conversationContext = '';
  if (history.length > 0) {
    conversationContext = '\n\nPrevious conversation:\n';
    for (const msg of history.slice(-6)) { // Keep last 6 messages for context
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      conversationContext += `${role}: ${msg.content}\n`;
    }
  }

  const userPrompt = `${conversationContext}\nUser's current question: ${question}`;
  return generate(systemInstruction, userPrompt);
}

/**
 * Generate an actionable checklist from a legal document.
 */
export async function generateChecklist(text: string): Promise<string> {
  const systemInstruction = `You are LegalLens, an expert at creating actionable checklists from legal documents. Your job is to extract all actionable items, obligations, deadlines, and requirements from a legal document and present them as organized checklists.

IMPORTANT: You are providing informational assistance only, NOT legal advice.

Create the following checklists:

1. **⏰ Immediate Actions Required**: Things that need to be done right away or before signing.
2. **📋 Ongoing Obligations**: Recurring responsibilities and commitments.
3. **📅 Key Deadlines & Dates**: All time-sensitive items with their deadlines.
4. **✅ Compliance Requirements**: Things you must do or avoid to stay in compliance.
5. **📝 Documents & Records to Maintain**: Paperwork, records, or documentation requirements.
6. **⚠️ Conditions & Triggers**: Events or conditions that would trigger specific actions or consequences.
7. **🔍 Items to Verify Before Signing**: Things to check, confirm, or negotiate before agreeing.

For each checklist item:
- Use checkbox format: - [ ] Item description
- Include relevant deadlines or timeframes in **bold**
- Note the clause or section it comes from in (parentheses)
- Flag high-priority items with ⚠️

End with a **Summary of Critical Dates** table if applicable.

Format in clean Markdown.`;

  return generate(systemInstruction, `Please generate comprehensive checklists from the following legal document:\n\n---\n${text}\n---`);
}

/**
 * Extract and explain legal terminology from a document.
 */
export async function extractGlossary(text: string): Promise<string> {
  const systemInstruction = `You are LegalLens, an expert legal terminology explainer. Your job is to identify every piece of legal jargon, technical term, and complex phrase in a document and explain them in plain English.

IMPORTANT: You are providing informational assistance only, NOT legal advice.

For each term, provide:

### Term Name
- **Found in context**: The sentence or phrase where this term appears in the document
- **Plain English meaning**: A simple, everyday explanation
- **Why it matters**: Why this term is important for understanding your rights or obligations
- **Example**: A real-world example to illustrate the concept

Organize terms into categories:
1. **📜 Contract & Agreement Terms** (e.g., indemnification, force majeure, severability)
2. **⚖️ Rights & Obligations** (e.g., fiduciary duty, liability, warranty)
3. **💰 Financial & Payment Terms** (e.g., liquidated damages, escrow, consideration)
4. **🔒 Privacy & Confidentiality Terms** (e.g., NDA, data processor, PII)
5. **⚠️ Risk & Liability Terms** (e.g., limitation of liability, hold harmless, negligence)
6. **📋 Procedural & Administrative Terms** (e.g., arbitration, jurisdiction, statute of limitations)

At the end, include a **Quick Reference Table** with all terms and their one-line definitions.

Format in clean Markdown.`;

  return generate(systemInstruction, `Please identify and explain all legal terms and jargon in the following document:\n\n---\n${text}\n---`);
}

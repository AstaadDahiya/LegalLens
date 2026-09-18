export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <p>
          © {new Date().getFullYear()} LegalLens — AI-Powered Legal Document Assistant.
          Built with Next.js and Google Gemini AI.
        </p>
        <p className="footer-disclaimer">
          <strong>⚠️ Legal Disclaimer:</strong> LegalLens is an AI-powered informational tool designed to help
          users understand legal documents. It does <strong>not</strong> provide legal advice, and its outputs
          should not be treated as a substitute for consultation with a qualified attorney. Always seek
          professional legal counsel for legal decisions. AI-generated analysis may contain errors
          or omissions. Use at your own discretion.
        </p>
      </div>
    </footer>
  );
}

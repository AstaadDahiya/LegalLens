export default function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner" role="note" aria-label="Legal disclaimer">
      <span className="disclaimer-icon" aria-hidden="true">⚠️</span>
      <p className="disclaimer-text">
        <strong>Not legal advice.</strong> LegalLens uses AI to help you understand legal documents.
        Outputs are informational only and may contain errors. Always consult a qualified attorney
        for legal decisions.
      </p>
    </div>
  );
}

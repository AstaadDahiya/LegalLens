export default function LoadingSpinner({ message = 'Analyzing your document...' }: { message?: string }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="loading-text">{message}</p>
      <span className="sr-only">Loading, please wait.</span>
    </div>
  );
}

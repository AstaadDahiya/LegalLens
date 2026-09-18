/**
 * Route-level loading state for feature pages.
 * Displays a consistent loading skeleton while the page component loads.
 */
export default function Loading() {
  return (
    <div className="container page-wrapper">
      <div className="loading-container" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p className="loading-text">Loading...</p>
        <span className="sr-only">Loading page, please wait.</span>
      </div>
    </div>
  );
}

import AsyncButton from './AsyncButton';

// A failed read has a visible recovery action rather than an endless spinner.
// The persona layout still owns the shared API refusal banner.
export default function LoadState({ message, loading, onRetry }) {
  if (!message) return <p className="text-secondary" role="status">{loading}</p>;
  return (
    <div>
      <p className="text-danger">{message}</p>
      <AsyncButton label="Try again" busyLabel="Retrying…" onClick={onRetry} className="btn btn-outline-primary" />
    </div>
  );
}

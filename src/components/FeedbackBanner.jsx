import { useFeedback } from '../context/FeedbackContext';

// Renders the shared feedback queue at the top of a persona layout.
// Messages are the backend's own actionable text (e.g. "This item is no
// longer available", "Too many failed sign-ins. Try again in 15 minutes.").
export default function FeedbackBanner() {
  const { items, dismiss } = useFeedback();
  if (items.length === 0) return null;

  return (
    <div className="container mt-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`alert alert-${item.kind} d-flex justify-content-between align-items-center`}
          role="alert"
        >
          <span>{item.message}</span>
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => dismiss(item.id)} />
        </div>
      ))}
    </div>
  );
}

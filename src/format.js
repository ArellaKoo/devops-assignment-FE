// The backend speaks integer cents and UTC ISO strings; these keep the
// display layer consistent.

export function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

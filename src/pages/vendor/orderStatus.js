// Shared order-status vocabulary for the vendor screens. The backend always
// decides validity (allowed_actions comes from the server); these constants
// only drive which views count as "active" for polling and badge colours.
export const ACTIVE_STATUSES = ['Pending', 'Preparing', 'Ready'];

export function statusBadgeClass(status) {
  switch (status) {
    case 'Pending':
      return 'text-bg-primary';
    case 'Preparing':
      return 'text-bg-info';
    case 'Ready':
      return 'text-bg-success';
    case 'Collected':
      return 'text-bg-secondary';
    case 'Cancelled':
      return 'text-bg-warning';
    case 'NoShow':
      return 'text-bg-dark';
    default:
      return 'text-bg-primary';
  }
}

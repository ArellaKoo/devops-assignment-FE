import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePolling from '../../hooks/usePolling';
import useTransitionError from '../../hooks/useTransitionError';
import { formatCents, formatDateTime } from '../../format';

// The diner's order list. Active view: polls every 3 s (cleared on unmount)
// so vendor moves show up, plus an explicit Refresh. The All/Current/Past
// filter lands with Task 10 (UI Past maps to view=history).
export default function DinerOrdersPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [orders, setOrders] = useState(null);
  const errors = useTransitionError(show);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/diner/orders?view=all');
      setOrders(data.items);
      errors.markOk();
    } catch (error) {
      setOrders(null);
      errors.markError(error.message);
    }
  }, [request, errors]);

  usePolling(load, 3000);

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">My orders</h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {orders === null ? (
        <p className="text-secondary">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="text-secondary">
          <p>You have no orders yet.</p>
          <Link className="btn btn-primary" to="/diner/stalls">
            Browse open stalls
          </Link>
        </div>
      ) : (
        <ul className="list-group">
          {orders.map((order) => (
            <li key={order.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <Link to={`/diner/orders/${order.id}`}>{order.queue_number}</Link>{' '}
                <span className="badge text-bg-primary">{order.status}</span>
                <div className="text-secondary small">
                  {order.vendor.name} · {formatDateTime(order.created_at)} · {formatCents(order.total_cents)}
                </div>
              </div>
              <Link className="btn btn-outline-primary btn-sm" to={`/diner/orders/${order.id}`}>
                Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

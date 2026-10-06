import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePolling from '../../hooks/usePolling';
import useTransitionError from '../../hooks/useTransitionError';
import { formatCents, formatDateTime } from '../../format';
import { ACTIVE_STATUSES, statusBadgeClass } from './orderStatus';

// The stall's paid queue (every stored order is paid). Active view: polls
// every 3 s while any order is still moving (a second account on the shared
// stall can move one) and stops once every order is terminal; the explicit
// Refresh always works. The queue stays fully accessible after closure.
export default function VendorOrdersPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [orders, setOrders] = useState(null);
  const [stall, setStall] = useState(null);
  const errors = useTransitionError(show);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/vendor/orders');
      setOrders(data.items);
      errors.markOk();
    } catch (error) {
      setOrders(null);
      errors.markError(error.message);
    }
  }, [request, errors]);

  const loadStall = useCallback(async () => {
    try {
      const data = await request('/api/vendor/stall');
      setStall(data.stall);
    } catch {
      // the trading state only feeds the closure banner
    }
  }, [request]);

  usePolling(
    load,
    3000,
    orders === null || orders.some((order) => ACTIVE_STATUSES.includes(order.status)),
  );

  useEffect(() => {
    loadStall();
  }, [loadStall]);

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Orders</h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {stall !== null && !stall.is_open && (
        <div className="alert alert-secondary" role="status">
          This stall is closed, so new orders are refused at checkout. Every paid order below
          stays fully accessible.
        </div>
      )}

      {orders === null ? (
        <p className="text-secondary">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-secondary">No paid orders for this stall yet.</p>
      ) : (
        <ul className="list-group">
          {orders.map((order) => (
            <li key={order.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <Link to={`/vendor/orders/${order.id}`}>{order.queue_number}</Link>{' '}
                <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
                <div className="text-secondary small">
                  {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
                  {formatCents(order.total_cents)} · {formatDateTime(order.created_at)}
                </div>
              </div>
              <Link className="btn btn-outline-primary btn-sm" to={`/vendor/orders/${order.id}`}>
                Manage
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

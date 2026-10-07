import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePolling from '../../hooks/usePolling';
import useTransitionError from '../../hooks/useTransitionError';
import { formatCents, formatDateTime } from '../../format';
import LoadState from '../../components/LoadState';

const ACTIVE_STATUSES = ['Pending', 'Preparing', 'Ready'];

// Order tracking (active) or read-only past detail (terminal).
// Active views poll every 3 s and stop when the order reaches a terminal
// state or the diner leaves; history views never poll. The Ready state
// raises the Ready-for-collection banner the moment it is observed.
export default function DinerOrderDetailPage() {
  const { orderId } = useParams();
  const { request } = useAuth();
  const { show } = useFeedback();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const errors = useTransitionError(show);

  const load = useCallback(async () => {
    try {
      const data = await request(`/api/diner/orders/${orderId}`);
      setOrder(data.order);
      setNotFound(false);
      errors.markOk();
    } catch (error) {
      if (error.status === 404 || error.status === 403) {
        setNotFound(true);
        setOrder(null);
      }
      errors.markError(error.message);
    }
  }, [request, orderId, errors]);

  // Poll while the order is unknown (first load) or in an active state; stop
  // on a terminal state so a Collected/Cancelled/NoShow order never refreshes.
  usePolling(load, 3000, !notFound && (order === null || ACTIVE_STATUSES.includes(order.status)), orderId);

  if (notFound) {
    return (
      <section>
        <h2>Order</h2>
        <p className="text-secondary">That order does not exist or is not yours.</p>
        <Link className="btn btn-outline-primary" to="/diner/orders">
          Back to your orders
        </Link>
      </section>
    );
  }

  if (order === null) {
    return (
      <section>
        <h2>Order</h2>
        <LoadState message={errors.message} loading="Loading the order…" onRetry={load} />
      </section>
    );
  }

  const ready = order.status === 'Ready';
  const terminal = !ACTIVE_STATUSES.includes(order.status);

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          {order.queue_number} <span className="badge text-bg-primary">{order.status}</span>
        </h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {ready && (
        <div className="alert alert-success" role="status">
          <strong>Your order is ready.</strong> Collect it at the counter.
        </div>
      )}
      {order.status === 'Collected' && (
        <div className="alert alert-secondary" role="status">
          Collected — thanks for ordering from {order.vendor.name}.
        </div>
      )}
      {order.status === 'Cancelled' && (
        <div className="alert alert-warning" role="status">
          This order was cancelled and its {order.payment.method} payment of {formatCents(order.payment.amount_cents)}{' '}
          was refunded.
        </div>
      )}
      {order.status === 'NoShow' && (
        <div className="alert alert-warning" role="status">
          This order was not collected and was marked No Show. The payment stays paid.
        </div>
      )}

      <p className="text-secondary">
        {order.vendor.name} · placed {formatDateTime(order.created_at)}
        {terminal ? '' : ' · updates automatically every few seconds'}
      </p>

      <ul className="list-group mb-3">
        {order.items.map((item) => (
          <li key={item.item_id} className="list-group-item d-flex justify-content-between">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatCents(item.price_cents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p>
        <strong>Total</strong> <strong>{formatCents(order.total_cents)}</strong>
      </p>
      <p className="text-secondary small mb-0">
        Payment: {order.payment.method} · {order.payment.status}
        {order.payment.refunded_at ? ` · refunded ${formatDateTime(order.payment.refunded_at)}` : ''}
      </p>
      <div className="mt-3">
        <Link className="btn btn-outline-secondary btn-sm" to="/diner/orders">
          Back to your orders
        </Link>
      </div>
    </section>
  );
}

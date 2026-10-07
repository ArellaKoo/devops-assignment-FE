import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePolling from '../../hooks/usePolling';
import useTransitionError from '../../hooks/useTransitionError';
import { useAsyncAction } from '../../components/AsyncButton';
import LoadState from '../../components/LoadState';
import { formatCents, formatDateTime } from '../../format';
import { ACTIVE_STATUSES, statusBadgeClass } from './orderStatus';

// The vendor's order detail: queue number, item quantities and payment
// state, plus only the actions the server currently allows
// (allowed_actions). NoShow is absent until Ready + 30 minutes, so the
// 30-minute rule is visible in the UI, not just enforced by the backend.
// Terminal orders are read-only; active orders poll every 3 s.
const ACTION_LABELS = {
  Preparing: 'Accept order',
  Cancelled: 'Reject order',
  Ready: 'Mark ready',
  Collected: 'Mark collected',
  NoShow: 'Mark no-show',
};
const ACTION_CLASSES = {
  Preparing: 'btn-primary',
  Cancelled: 'btn-outline-danger',
  Ready: 'btn-success',
  Collected: 'btn-primary',
  NoShow: 'btn-outline-warning',
};
const SUCCESS_NOTICES = {
  Preparing: 'Accepted — the order is now preparing.',
  Cancelled: 'Rejected; the payment has been refunded.',
  Ready: 'Marked ready; the diner can collect it at the counter.',
  Collected: 'Marked collected — the order is complete.',
  NoShow: 'Marked no-show; the payment stays paid.',
};

export default function VendorOrderDetailPage() {
  const { orderId } = useParams();
  const { request } = useAuth();
  const { show } = useFeedback();
  const [order, setOrder] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const errors = useTransitionError(show);

  const load = useCallback(async () => {
    try {
      const data = await request(`/api/vendor/orders/${orderId}`);
      setOrder(data.order);
      setErrorInfo(null);
      errors.markOk();
    } catch (error) {
      if (error.status === 404 || error.status === 403) {
        setErrorInfo({ message: error.message });
        setOrder(null);
      }
      errors.markError(error.message);
    }
  }, [request, orderId, errors]);

  usePolling(load, 3000, errorInfo === null && (order === null || ACTIVE_STATUSES.includes(order.status)), orderId);

  const { busy, run: transition } = useAsyncAction(async (target) => {
    if (target === 'Cancelled' && !window.confirm('Reject this order? The diner’s payment will be refunded.')) {
      return;
    }
    if (target === 'NoShow' && !window.confirm('Mark this order as a no-show? The diner’s payment stays paid.')) {
      return;
    }
    try {
      const data = await request(`/api/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: target },
      });
      setOrder(data.order);
      show(SUCCESS_NOTICES[target], 'success');
    } catch (error) {
      show(error.message);
      await load();
    }
  });

  if (errorInfo !== null) {
    return (
      <section>
        <h2>Order</h2>
        <p className="text-secondary">{errorInfo.message}</p>
        <Link className="btn btn-outline-primary" to="/vendor/orders">
          Back to your order queue
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

  const payment = order.payment;

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          {order.queue_number}{' '}
          <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
        </h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {order.status === 'Collected' && (
        <div className="alert alert-secondary" role="status">
          Collected — this order is complete and can no longer be changed.
        </div>
      )}
      {order.status === 'Cancelled' && (
        <div className="alert alert-warning" role="status">
          This order was rejected. The {payment.method} payment of {formatCents(payment.amount_cents)}
          {payment.refunded_at ? ` was refunded on ${formatDateTime(payment.refunded_at)}` : ' was refunded.'}
        </div>
      )}
      {order.status === 'NoShow' && (
        <div className="alert alert-warning" role="status">
          The diner did not collect. The {payment.method} payment of {formatCents(payment.amount_cents)}{' '}
          stays paid.
        </div>
      )}

      <p className="text-secondary">
        {order.vendor.name} · placed {formatDateTime(order.created_at)}
        {order.ready_at ? ` · ready ${formatDateTime(order.ready_at)}` : ''}
        {ACTIVE_STATUSES.includes(order.status) ? ' · updates automatically every few seconds' : ''}
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
      <p className="text-secondary small mb-3">
        Payment: {payment.method} · {payment.status} · {formatCents(payment.amount_cents)}
        {payment.refunded_at ? ` · refunded ${formatDateTime(payment.refunded_at)}` : ''}
      </p>

      {order.status === 'Ready' && <p className="text-secondary small">A no-show can be marked 30 minutes after the ready time. The order can still be collected.</p>}
      {busy && <p className="text-secondary" role="status">Updating the order…</p>}

      {order.allowed_actions.length > 0 ? (
        <div className="d-flex gap-2 flex-wrap">
          {order.allowed_actions.map((target) => (
            <button
              key={target}
              type="button"
              className={`btn ${ACTION_CLASSES[target]}`}
              disabled={busy || Boolean(errors.message)}
              onClick={() => transition(target)}
            >
              {ACTION_LABELS[target]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-secondary small">This order is final; it can no longer be changed.</p>
      )}

      <div className="mt-3">
        <Link className="btn btn-outline-secondary btn-sm" to="/vendor/orders">
          Back to your order queue
        </Link>
      </div>
    </section>
  );
}

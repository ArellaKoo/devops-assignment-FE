import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePolling from '../../hooks/usePolling';
import useTransitionError from '../../hooks/useTransitionError';
import { formatCents, formatDateTime } from '../../format';
import LoadState from '../../components/LoadState';

// The diner's Order List (US10): All/Current/Past over the server's
// view=all|current|history — UI Past maps to view=history. All and Current
// poll every 3 s so vendor moves appear (the server recomputes the lists
// from current statuses); Past never polls — terminal orders cannot change.
// Read-only past detail reuses the Order Detail screen.
const FILTERS = [
  { view: 'all', label: 'All' },
  { view: 'current', label: 'Current' },
  { view: 'history', label: 'Past' },
];

export default function DinerOrdersPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [orders, setOrders] = useState(null);
  const [view, setView] = useState('all');
  const errors = useTransitionError(show);

  const viewRef = useRef(view);
  viewRef.current = view;

  const load = useCallback(async () => {
    const requestedView = viewRef.current;
    try {
      const data = await request(`/api/diner/orders?view=${requestedView}`);
      if (requestedView !== viewRef.current) return; // the filter moved on
      setOrders(data.items);
      errors.markOk();
    } catch (error) {
      if (requestedView !== viewRef.current) return;
      setOrders(null);
      errors.markError(error.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const loadRef = useRef(load);
  loadRef.current = load;

  usePolling(load, 3000, view !== 'history', view);

  // The history view never polls, so the switch to it is not covered by the
  // hook's immediate tick: load the selected view once when the filter moves.
  useEffect(() => {
    if (view === 'history') loadRef.current();
  }, [view]);

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">My orders</h2>
        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group" role="group" aria-label="Order filters">
            {FILTERS.map((filter) => (
              <button
                key={filter.view}
                type="button"
                className={`btn btn-sm ${
                  view === filter.view ? 'btn-primary' : 'btn-outline-primary'
                }`}
                aria-pressed={view === filter.view}
                onClick={() => setView(filter.view)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {orders === null ? (
        <LoadState message={errors.message} loading="Loading your orders…" onRetry={load} />
      ) : orders.length === 0 ? (
        view === 'all' ? (
          <div className="text-secondary">
            <p>You have no orders yet.</p>
            <Link className="btn btn-primary" to="/diner/stalls">
              Browse open stalls
            </Link>
          </div>
        ) : view === 'current' ? (
          <p className="text-secondary">No orders in progress right now.</p>
        ) : (
          <p className="text-secondary">No past orders yet.</p>
        )
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

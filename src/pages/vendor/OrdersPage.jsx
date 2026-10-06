import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents } from '../../format';

// Stub of the vendor's paid queue (Task 9 adds the lifecycle actions driven
// by allowed_actions).
export default function VendorOrdersPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let active = true;
    request('/api/vendor/orders')
      .then((data) => active && setOrders(data.items))
      .catch((error) => {
        if (active) {
          setOrders(null);
          show(error.message);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h2>Orders</h2>
      {orders === null ? (
        <p className="text-secondary">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-secondary">No orders are waiting for your stall.</p>
      ) : (
        <ul className="list-group">
          {orders.map((order) => (
            <li key={order.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <Link to={`/vendor/orders/${order.id}`}>{order.queue_number}</Link>{' '}
                <span className="badge text-bg-primary">{order.status}</span>
                <div className="text-secondary small">{formatCents(order.total_cents)}</div>
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

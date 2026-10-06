import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents, formatDateTime } from '../../format';

// Stub of the order list (Task 10 adds the All/Current/Past views).
export default function DinerOrdersPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let active = true;
    request('/api/diner/orders?view=all')
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
      <h2>My orders</h2>
      {orders === null ? (
        <p className="text-secondary">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-secondary">You have no orders yet.</p>
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

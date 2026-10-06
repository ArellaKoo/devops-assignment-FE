import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents, formatDateTime } from '../../format';

// Stub of the diner's order detail (Task 8 adds the Ready banner and polling).
export default function DinerOrderDetailPage() {
  const { orderId } = useParams();
  const { request } = useAuth();
  const { show } = useFeedback();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let active = true;
    request(`/api/diner/orders/${orderId}`)
      .then((data) => active && setOrder(data.order))
      .catch((error) => {
        if (active) {
          setOrder(null);
          show(error.message);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (order === null) {
    return (
      <section>
        <h2>Order</h2>
        <p className="text-secondary">Loading the order…</p>
      </section>
    );
  }

  return (
    <section>
      <h2>
        {order.queue_number} <span className="badge text-bg-primary">{order.status}</span>
      </h2>
      <p className="text-secondary mb-3">
        {order.vendor.name} · placed {formatDateTime(order.created_at)} · paid as{' '}
        {order.payment.method} ({order.payment.status})
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
    </section>
  );
}

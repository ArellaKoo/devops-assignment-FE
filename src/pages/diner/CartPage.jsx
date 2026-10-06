import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents } from '../../format';

// Stub of the diner's cart (Task 8 adds line editing and the checkout gate).
export default function DinerCartPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    let active = true;
    request('/api/diner/cart')
      .then((data) => active && setCart(data.cart))
      .catch((error) => {
        if (active) {
          setCart(null);
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
      <h2>Your cart</h2>
      {cart === null ? (
        <p className="text-secondary">Loading your cart…</p>
      ) : cart.items.length === 0 ? (
        <p className="text-secondary">Your cart is empty.</p>
      ) : (
        <>
          <ul className="list-group mb-3">
            {cart.items.map((line) => (
              <li key={line.item_id} className="list-group-item d-flex justify-content-between">
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span>{formatCents(line.line_cents)}</span>
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Total</strong> <strong>{formatCents(cart.total_cents)}</strong>
            </div>
            <Link to="/diner/checkout" className="btn btn-primary">
              Checkout
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

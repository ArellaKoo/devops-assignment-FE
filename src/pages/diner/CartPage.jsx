import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import useTransitionError from '../../hooks/useTransitionError';
import { useAsyncAction } from '../../components/AsyncButton';
import LoadState from '../../components/LoadState';
import { formatCents } from '../../format';

// Cart review. The server computes the total and the checkout freshness
// fingerprint; the screen only edits line quantities (PATCH) or removes
// lines (DELETE; a decrement to 0 removes the line server-side).
// Not an active-polling view: it loads on entry, after every mutation, and
// on the explicit Refresh.
export default function DinerCartPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [cart, setCart] = useState(null);
  const errors = useTransitionError(show);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/diner/cart');
      setCart(data.cart);
      errors.markOk();
    } catch (error) {
      setCart(null);
      errors.markError(error.message);
    }
  }, [request, errors]);

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    loadRef.current();
  }, []);

  const changeCartAction = useCallback(
    async (line, options) => {
      try {
        const data = await request(`/api/diner/cart/items/${line.item_id}`, options);
        setCart(data.cart);
        errors.markOk();
      } catch (error) {
        show(error.message);
        // The record changed underneath us (e.g. the item sold out): reload
        // the server's state instead of trusting the local lines.
        await load();
      }
    },
    [request, show, load, errors],
  );
  const { busy: cartBusy, run: changeCart } = useAsyncAction(changeCartAction);
  const setQuantity = (line, quantity) => changeCart(line, { method: 'PATCH', body: { quantity } });
  const removeLine = (line) => changeCart(line, { method: 'DELETE' });

  if (cart === null) {
    return (
      <section>
        <h2>Your cart</h2>
        <LoadState message={errors.message} loading="Loading your cart…" onRetry={load} />
      </section>
    );
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Your cart</h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {cart.stall && !cart.stall.is_open && (
        <div className="alert alert-secondary" role="status">
          <strong>{cart.stall.name} is currently closed.</strong> You can remove items or return when the stall opens.
        </div>
      )}
      {cartBusy && <p className="text-secondary" role="status">Updating your cart…</p>}

      {cart.items.length === 0 ? (
        <div className="text-secondary">
          <p>Your cart is empty.</p>
          <Link className="btn btn-primary" to="/diner/stalls">
            Browse open stalls
          </Link>
        </div>
      ) : (
        <>
          <ul className="list-group mb-3">
            {cart.items.map((line) => (
              <li key={line.item_id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="me-3">
                    <strong>{line.name}</strong>
                    {!line.is_available && <span className="badge text-bg-secondary ms-2">Sold out</span>}
                    <div className="text-secondary small">{formatCents(line.price_cents)} each</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group" role="group" aria-label={`Quantity for ${line.name}`}>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        disabled={cartBusy || !line.is_available || !cart.stall?.is_open}
                        onClick={() => setQuantity(line, line.quantity - 1)}
                        aria-label={`Decrease quantity of ${line.name}`}
                      >
                        −
                      </button>
                      <span className="btn btn-outline-secondary btn-sm disabled">{line.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        disabled={cartBusy || !line.is_available || !cart.stall?.is_open}
                        onClick={() => setQuantity(line, line.quantity + 1)}
                        aria-label={`Increase quantity of ${line.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="fw-semibold" style={{ minWidth: '72px', textAlign: 'right' }}>
                      {formatCents(line.line_cents)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={cartBusy}
                      onClick={() => removeLine(line)}
                      aria-label={`Remove ${line.name} from the cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <span>
                  Total: <strong>{formatCents(cart.total_cents)}</strong>
                </span>
                {!cartBusy && cart.stall?.is_open && cart.items.every((line) => line.is_available) && <Link to="/diner/checkout" className="btn btn-primary">
                  Continue to checkout
                </Link>}
              </div>
              {cart.items.some((line) => !line.is_available) && <p className="text-warning-emphasis mb-0 mt-2">Remove sold-out items before continuing to checkout.</p>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

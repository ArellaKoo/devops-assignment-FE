import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import AsyncButton from '../../components/AsyncButton';
import useTransitionError from '../../hooks/useTransitionError';
import { formatCents } from '../../format';

const PAYMENT_METHODS = ['PayNow', 'Card', 'Cashless'];

function newCheckoutKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Simulated payment. One checkout key is minted when the page loads and is
// retained across retries of the same payment: the server treats a matching
// replay as the same request (unique (diner, checkout_key) index), so a
// retry can never store a second order for this attempt. The synchronous
// `placingRef` re-entry guard plus AsyncButton's in-flight disable means a
// double click starts at most one request from this tab; requests beyond the
// UI (second tab, network retry) are the database idempotency's job.
export default function DinerCheckoutPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [cart, setCart] = useState(null); // null = still loading
  const [paymentMethod, setPaymentMethod] = useState('PayNow');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [lastFailure, setLastFailure] = useState(null); // {code, message}
  const [placing, setPlacing] = useState(false);
  const checkoutKey = useRef(newCheckoutKey()).current;
  const placingRef = useRef(false);
  const errors = useTransitionError(show);

  const loadCart = useCallback(async () => {
    try {
      const data = await request('/api/diner/cart');
      setCart(data.cart);
      errors.markOk();
    } catch (error) {
      setCart(null);
      errors.markError(error.message);
    }
  }, [request, errors]);

  const loadCartRef = useRef(loadCart);
  loadCartRef.current = loadCart;
  useEffect(() => {
    loadCartRef.current();
  }, []);

  const refreshAndRetry = useCallback(async () => {
    setLastFailure(null);
    await loadCart();
  }, [loadCart]);

  const placeOrder = useCallback(async () => {
    if (placingRef.current) return; // synchronous re-entry guard
    if (!cart || !cart.fingerprint) return;
    placingRef.current = true;
    setPlacing(true);
    setLastFailure(null);
    try {
      const data = await request('/api/diner/orders', {
        method: 'POST',
        body: {
          payment_method: paymentMethod,
          simulate_success: !simulateFailure,
          checkout_key: checkoutKey,
          expected_fingerprint: cart.fingerprint,
        },
      });
      setPlacedOrder(data.order);
    } catch (error) {
      setLastFailure({ code: error.code, message: error.message });
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  }, [request, cart, paymentMethod, simulateFailure, checkoutKey]);

  // --- states ---------------------------------------------------------------

  if (placedOrder) {
    return (
      <section>
        <h2>Payment successful</h2>
        <div className="card mt-3">
          <div className="card-body">
            <p>
              <strong>Queue number: {placedOrder.queue_number}</strong>
            </p>
            <p className="mb-1">
              Order <code>{placedOrder.id}</code> · {placedOrder.status}
            </p>
            <p className="mb-1">
              Paid with {placedOrder.payment.method} ({placedOrder.payment.status}),{' '}
              {formatCents(placedOrder.total_cents)}
            </p>
            <p className="text-secondary small mb-3">
              The stall will prepare it; track the order for updates.
            </p>
            <div className="d-flex gap-2">
              <Link className="btn btn-primary" to={`/diner/orders/${placedOrder.id}`}>
                Track your order
              </Link>
              <Link className="btn btn-outline-secondary" to="/diner/stalls">
                Back to stalls
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (cart === null) {
    return (
      <section>
        <h2>Checkout</h2>
        <p className="text-secondary">Loading your cart…</p>
      </section>
    );
  }

  if (cart.items.length === 0 || !cart.fingerprint) {
    return (
      <section>
        <h2>Checkout</h2>
        <p className="text-secondary">Your cart is empty, so there is nothing to pay for.</p>
        <Link className="btn btn-primary" to="/diner/stalls">
          Browse open stalls
        </Link>
      </section>
    );
  }

  // Stale-cart refusals: the cart changed (price, availability, closure) or
  // emptied since this page read it. Offer a review or a refresh-and-retry
  // with the current fingerprint; the same checkout key is kept.
  if (lastFailure && ['price_changed', 'item_unavailable', 'stall_closed', 'cart_empty'].includes(lastFailure.code)) {
    return (
      <section>
        <h2>Checkout refused</h2>
        <div className="alert alert-warning" role="alert">
          {lastFailure.message}
        </div>
        <p className="text-secondary small">
          Your checkout key is retained for this attempt; reviewing or refreshing the cart will re-send the server's
          current fingerprint.
        </p>
        <div className="d-flex gap-2">
          <Link className="btn btn-primary" to="/diner/cart">
            Review your cart
          </Link>
          <button type="button" className="btn btn-outline-primary" onClick={refreshAndRetry}>
            Refresh and retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Checkout</h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadCart}>
          Refresh
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          {cart.items.map((line) => (
            <div key={line.item_id} className="d-flex justify-content-between">
              <span>
                {line.quantity} × {line.name}
              </span>
              <span>{formatCents(line.line_cents)}</span>
            </div>
          ))}
          <hr />
          <div className="d-flex justify-content-between">
            <span>
              Total: <strong>{formatCents(cart.total_cents)}</strong>
            </span>
            <Link className="btn btn-link btn-sm p-0" to="/diner/cart">
              Edit cart
            </Link>
          </div>
          <div className="text-secondary small mt-1">
            Cart fingerprint: <code>{cart.fingerprint}</code>
          </div>
        </div>
      </div>

      {lastFailure && lastFailure.code === 'payment_failed' && (
        <div className="alert alert-danger" role="alert">
          {lastFailure.message} The same checkout key is retained — retrying will not create a duplicate order.
        </div>
      )}
      {lastFailure && lastFailure.code === 'checkout_key_conflict' && (
        <div className="alert alert-danger" role="alert">
          {lastFailure.message}
        </div>
      )}
      {lastFailure && !['payment_failed', 'checkout_key_conflict'].includes(lastFailure.code) && (
        <div className="alert alert-danger" role="alert">
          {lastFailure.message} Retry this payment attempt once the service is available.
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h3 className="h6">Payment method (simulated)</h3>
          <div className="mb-3">
            {PAYMENT_METHODS.map((method) => (
              <div className="form-check" key={method}>
                <input
                  className="form-check-input"
                  type="radio"
                  id={`pay-${method}`}
                  name="payment-method"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <label className="form-check-label" htmlFor={`pay-${method}`}>
                  {method}
                </label>
              </div>
            ))}
          </div>
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="simulate-failure"
              checked={simulateFailure}
              onChange={(event) => setSimulateFailure(event.target.checked)}
            />
            <label className="form-check-label text-secondary small" htmlFor="simulate-failure">
              Simulate this payment failing (demo control)
            </label>
          </div>
          <AsyncButton
            label={`Pay ${formatCents(cart.total_cents)}`}
            busyLabel="Processing payment…"
            onClick={placeOrder}
            disabled={placing}
            className="w-100"
          />
        </div>
      </div>
    </section>
  );
}

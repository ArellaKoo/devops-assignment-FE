import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import usePolling from '../../hooks/usePolling';
import useTransitionError from '../../hooks/useTransitionError';
import { formatCents } from '../../format';

// One stall's published menu, active while the diner is on it:
// - polls every 3 s (cleared on unmount), so a vendor closing the stall or
//   selling out an item shows up without a manual reload;
// - unavailable items are greyed out with their Add control disabled before
//   the diner can act;
// - a closed stall shows its banner and disables every Add control;
// - an item newly observed as sold-out raises a one-time toast;
// - "Add" sends the desired line quantity (current quantity + 1), because the
//   server SETS the line's quantity on add.
export default function DinerMenuPage() {
  const { stallId } = useParams();
  const { request } = useAuth();
  const { show } = useFeedback();
  const [menu, setMenu] = useState(null); // {stall, items}
  const [cart, setCart] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const previousAvailability = useRef(null);
  const menuErrors = useTransitionError(show);
  const cartErrors = useTransitionError(show);

  const loadMenu = useCallback(async () => {
    try {
      const data = await request(`/api/diner/stalls/${stallId}/menu`);
      const newlySoldOut = [];
      if (previousAvailability.current) {
        for (const item of data.items) {
          if (previousAvailability.current.get(item.id) === true && !item.is_available) {
            newlySoldOut.push(item.name);
          }
        }
      }
      previousAvailability.current = new Map(data.items.map((item) => [item.id, item.is_available]));
      setMenu(data);
      setNotFound(false);
      menuErrors.markOk();
      if (newlySoldOut.length > 0) {
        show(`${newlySoldOut.join(' and ')} is no longer available.`, 'warning');
      }
    } catch (error) {
      if (error.status === 404) setNotFound(true);
      setMenu(null);
      menuErrors.markError(error.message);
    }
  }, [request, show, stallId, menuErrors]);

  const loadCart = useCallback(async () => {
    try {
      const data = await request('/api/diner/cart');
      setCart(data.cart);
      cartErrors.markOk();
    } catch (error) {
      setCart(null);
      cartErrors.markError(error.message);
    }
  }, [request, cartErrors]);

  usePolling(loadMenu, 3000, !notFound);
  usePolling(loadCart, 3000);

  const quantityFor = useCallback(
    (itemId) => {
      if (!cart) return 0;
      const line = cart.items.find((entry) => entry.item_id === itemId);
      return line ? line.quantity : 0;
    },
    [cart],
  );

  const addItem = useCallback(
    async (item) => {
      try {
        const data = await request('/api/diner/cart/items', {
          method: 'POST',
          body: { item_id: item.id, quantity: quantityFor(item.id) + 1 },
        });
        setCart(data.cart);
        cartErrors.markOk();
        show(`${item.name} added — your cart total is now ${formatCents(data.cart.total_cents)}.`, 'success');
      } catch (error) {
        show(error.message);
        if (error.code === 'item_unavailable') {
          // The world changed underneath the menu: pull the live state again.
          loadMenu();
        }
        loadCart();
      }
    },
    [request, show, quantityFor, loadMenu, loadCart, cartErrors],
  );

  if (notFound) {
    return (
      <section>
        <h2>Menu</h2>
        <p className="text-secondary">That stall does not exist.</p>
        <Link className="btn btn-outline-primary" to="/diner/stalls">
          Back to stalls
        </Link>
      </section>
    );
  }

  if (menu === null) {
    return (
      <section>
        <h2>Menu</h2>
        <p className="text-secondary">Loading the menu…</p>
      </section>
    );
  }

  const { stall, items } = menu;

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{stall.name}</h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadMenu}>
          Refresh
        </button>
      </div>

      {!stall.is_open && (
        <div className="alert alert-secondary" role="alert">
          <strong>{stall.name} is currently closed.</strong> Try again once the stall opens.
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-secondary">This stall has no menu items yet.</p>
      ) : (
        <ul className="list-group">
          {items.map((item) => {
            const quantity = quantityFor(item.id);
            const disabled = !item.is_available || !stall.is_open;
            return (
              <li key={item.id} className={`list-group-item ${item.is_available ? '' : 'text-secondary'}`}>
                <div className="d-flex gap-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="rounded"
                      style={{ width: 96, height: 72, objectFit: 'cover' }}
                    />
                  )}
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                      <strong>{item.name}</strong>
                      {!item.is_available && <span className="badge text-bg-secondary">Sold out</span>}
                    </div>
                    <div className="text-secondary small">{item.description}</div>
                    <div className="mt-2 d-flex align-items-center justify-content-between">
                      <span>{formatCents(item.price_cents)}</span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={disabled}
                        onClick={() => addItem(item)}
                      >
                        {item.is_available ? (quantity > 0 ? `Add another (in cart: ${quantity})` : 'Add') : 'Sold out'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {cart && cart.items.length > 0 && (
        <div className="card mt-3">
          <div className="card-body d-flex justify-content-between align-items-center py-2">
            <span>
              Cart total: <strong>{formatCents(cart.total_cents)}</strong>
            </span>
            <Link className="btn btn-primary btn-sm" to="/diner/cart">
              Review your cart
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents, formatDateTime } from '../../format';
import { useAsyncAction } from '../../components/AsyncButton';
import LoadState from '../../components/LoadState';

// The vendor's trading screen: the own-stall menu with the open/close switch,
// per-item sold-out toggles, and edit/remove links. The vendor is this
// screen's actor, so it loads on mount, after every mutation, and on Refresh
// (no polling); the paid order queue is the active polling view.
export default function VendorMenuPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [data, setData] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      const payload = await request('/api/vendor/menu');
      setData(payload);
      setLoadError(null);
    } catch (error) {
      setData(null);
      setLoadError(error.message);
      show(error.message);
    }
  }, [request, show]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStall = async () => {
    if (busyKey !== null) return;
    setBusyKey('stall');
    try {
      const payload = await request('/api/vendor/stall', {
        method: 'PATCH',
        body: { is_open: !data.stall.is_open },
      });
      setData((previous) => ({ ...previous, stall: payload.stall }));
      show(
        payload.stall.is_open
          ? 'The stall is now open.'
          : 'The stall is now closed; diners cannot add to a cart here, and the paid queue stays accessible.',
        'success',
      );
    } catch (error) {
      show(error.message);
      load();
    } finally {
      setBusyKey(null);
    }
  };

  const toggleAvailability = async (item) => {
    if (busyKey !== null) return;
    setBusyKey(`availability:${item.id}`);
    try {
      const payload = await request(`/api/vendor/menu/${item.id}`, {
        method: 'PATCH',
        body: { is_available: !item.is_available },
      });
      setData((previous) => ({
        ...previous,
        items: previous.items.map((entry) =>
          entry.id === payload.item.id ? payload.item : entry,
        ),
      }));
      show(
        payload.item.is_available
          ? `${payload.item.name} is back on the menu.`
          : `${payload.item.name} is now marked sold out.`,
        'success',
      );
    } catch (error) {
      show(error.message);
      load();
    } finally {
      setBusyKey(null);
    }
  };

  const removeItem = async (item) => {
    const confirmed = window.confirm(
      `Remove ${item.name} from the menu? Orders that already include it keep their recorded item.`,
    );
    if (!confirmed) return;
    if (busyKey !== null) return;
    setBusyKey(`remove:${item.id}`);
    try {
      await request(`/api/vendor/menu/${item.id}`, { method: 'DELETE' });
      setData((previous) => ({
        ...previous,
        items: previous.items.filter((entry) => entry.id !== item.id),
      }));
      show(`${item.name} was removed from the menu; past orders keep their recorded copy.`, 'success');
    } catch (error) {
      show(error.message);
      load();
    } finally {
      setBusyKey(null);
    }
  };

  const { busy: anyBusy, run: mutate } = useAsyncAction(async (action, ...args) => action(...args));

  if (data === null) {
    return (
      <section>
        <h2>Menu</h2>
        <LoadState message={loadError} loading="Loading your menu…" onRetry={load} />
      </section>
    );
  }

  const { stall, items } = data;

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0">
          {stall.name}{' '}
          <span className={`badge ${stall.is_open ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {stall.is_open ? 'Open' : 'Closed'}
          </span>
        </h2>
        <div className="d-flex gap-2 align-items-center">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
            Refresh
          </button>
          <Link to="/vendor/menu/new" className="btn btn-primary btn-sm">
            Add menu item
          </Link>
        </div>
      </div>

      {anyBusy && <p className="text-secondary" role="status">Updating your menu…</p>}

      <div className="form-check form-switch fs-6 mb-3">
        <input
          type="checkbox"
          role="switch"
          id="stall-trading-switch"
          className="form-check-input"
          checked={stall.is_open}
          disabled={anyBusy}
          onChange={() => mutate(toggleStall)}
        />
        <label className="form-check-label" htmlFor="stall-trading-switch">
          Trading state — {stall.is_open ? 'open; diners can order here' : 'closed; diners cannot order here'}
        </label>
      </div>

      {!stall.is_open && (
        <div className="alert alert-secondary" role="status">
          This stall is closed, so new orders are refused at checkout. Every paid order in{' '}
          <Link to="/vendor/orders">your order queue</Link> stays accessible.
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-secondary">Your menu is empty. Add your first item.</p>
      ) : (
        <ul className="list-group">
          {items.map((item) => (
            <li
              key={item.id}
              className={`list-group-item ${item.is_available ? '' : 'text-secondary'}`}
            >
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
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <strong>{item.name}</strong>
                    {!item.is_available && <span className="badge text-bg-secondary">Sold out</span>}
                    <span className="text-secondary small ms-auto">
                      {formatCents(item.price_cents)} · updated {formatDateTime(item.updated_at)}
                    </span>
                  </div>
                  <div className="text-secondary small">{item.description}</div>
                  <div className="mt-2 d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={anyBusy}
                      onClick={() => mutate(toggleAvailability, item)}
                    >
                      {item.is_available ? 'Mark sold out' : 'Restock'}
                    </button>
                    <Link className="btn btn-outline-primary btn-sm" to={`/vendor/menu/${item.id}/edit`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={anyBusy}
                      onClick={() => mutate(removeItem, item)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

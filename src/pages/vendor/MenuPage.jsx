import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents } from '../../format';

// Stub of the vendor's menu screen (Task 9 adds the open/close switch and item editing).
export default function VendorMenuPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    request('/api/vendor/menu')
      .then((payload) => active && setData(payload))
      .catch((error) => {
        if (active) {
          setData(null);
          show(error.message);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (data === null) {
    return (
      <section>
        <h2>Menu</h2>
        <p className="text-secondary">Loading your menu…</p>
      </section>
    );
  }

  const { stall, items } = data;
  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          {stall.name}{' '}
          <span className={`badge ${stall.is_open ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {stall.is_open ? 'Open' : 'Closed'}
          </span>
        </h2>
        <Link to="/vendor/menu/new" className="btn btn-primary btn-sm">
          Add menu item
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-secondary">Your menu is empty.</p>
      ) : (
        <ul className="list-group">
          {items.map((item) => (
            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{item.name}</strong>{' '}
                {!item.is_available && <span className="badge text-bg-secondary">Sold out</span>}
                <div className="text-secondary small">{item.description}</div>
              </div>
              <div>
                <span className="me-2">{formatCents(item.price_cents)}</span>
                <Link className="btn btn-outline-secondary btn-sm" to={`/vendor/menu/${item.id}/edit`}>
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

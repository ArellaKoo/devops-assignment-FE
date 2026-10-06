import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatCents } from '../../format';

// Stub of the stall menu (Task 8 adds add-to-cart, sold-out handling, polling).
export default function DinerMenuPage() {
  const { stallId } = useParams();
  const { request } = useAuth();
  const { show } = useFeedback();
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    let active = true;
    request(`/api/diner/stalls/${stallId}/menu`)
      .then((data) => active && setMenu(data.items))
      .catch((error) => {
        if (active) {
          setMenu(null);
          show(error.message);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stallId]);

  return (
    <section>
      <h2>Menu</h2>
      {menu === null ? (
        <p className="text-secondary">Loading menu…</p>
      ) : menu.length === 0 ? (
        <p className="text-secondary">This stall has no menu items.</p>
      ) : (
        <ul className="list-group">
          {menu.map((item) => (
            <li key={item.id} className="list-group-item d-flex justify-content-between">
              <div>
                <strong>{item.name}</strong>{' '}
                {!item.available && <span className="badge text-bg-secondary">Sold out</span>}
                <div className="text-secondary small">{item.description}</div>
              </div>
              <span>{formatCents(item.price_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';

// Stub of the diner's stall list (Task 8 adds the full screen with polling).
export default function DinerStallsPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [stalls, setStalls] = useState(null);

  useEffect(() => {
    let active = true;
    request('/api/diner/stalls')
      .then((data) => active && setStalls(data.items))
      .catch((error) => {
        if (active) {
          setStalls(null);
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
      <h2>Stalls</h2>
      {stalls === null ? (
        <p className="text-secondary">Loading stalls…</p>
      ) : stalls.length === 0 ? (
        <p className="text-secondary">No stalls are available.</p>
      ) : (
        <ul className="list-group">
          {stalls.map((stall) => (
            <li key={stall.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <Link to={`/diner/stalls/${stall.id}`}>{stall.name}</Link>{' '}
                <span className={`badge ${stall.is_open ? 'text-bg-success' : 'text-bg-secondary'}`}>
                  {stall.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
              <Link className="btn btn-outline-primary btn-sm" to={`/diner/stalls/${stall.id}`}>
                View menu
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

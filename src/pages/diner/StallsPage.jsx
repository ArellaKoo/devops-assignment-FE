import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import LoadState from '../../components/LoadState';

// Open-stall browser. The list loads on entry and on the explicit Refresh;
// it does not poll (the menu and order views are the active ones).
export default function DinerStallsPage() {
  const { request } = useAuth();
  const { show } = useFeedback();
  const [stalls, setStalls] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/diner/stalls');
      setStalls(data.items);
      setLoadError(null);
    } catch (error) {
      setStalls(null);
      setLoadError(error.message);
      show(error.message);
    }
  }, [request, show]);

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    loadRef.current();
  }, []);

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Stalls</h2>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>
      {stalls === null ? (
        <LoadState message={loadError} loading="Loading stalls…" onRetry={load} />
      ) : stalls.length === 0 ? (
        <p className="text-secondary">No stalls are open right now.</p>
      ) : (
        <ul className="list-group">
          {stalls.map((stall) => (
            <li key={stall.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <Link to={`/diner/stalls/${stall.id}`}>{stall.name}</Link>{' '}
                <span className="badge text-bg-success">Open</span>
              </div>
              <Link className="btn btn-primary btn-sm" to={`/diner/stalls/${stall.id}`}>
                View menu
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import FeedbackBanner from '../components/FeedbackBanner';

// Protected diner shell: persona navigation, sign-out, the shared feedback
// banner, and the nested route's screen. Rendered only inside RequireRole.
export default function DinerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand mb-0 h1">SkipQ</span>
          <span className="navbar-text me-auto d-none d-md-inline">Diner — {user.email}</span>
          <NavLink className="nav-link" to="/diner/stalls">
            Stalls
          </NavLink>
          <NavLink className="nav-link" to="/diner/cart">
            Cart
          </NavLink>
          <NavLink className="nav-link" to="/diner/orders">
            My orders
          </NavLink>
          <button type="button" className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>
      <FeedbackBanner />
      <div className="container py-4">
        <Outlet />
      </div>
    </div>
  );
}

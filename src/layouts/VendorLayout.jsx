import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import FeedbackBanner from '../components/FeedbackBanner';

// Protected vendor shell: persona navigation, sign-out, the shared feedback
// banner, and the nested route's screen. Rendered only inside RequireRole.
export default function VendorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const stallName = user.stall && user.stall.name;

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand mb-0 h1">SkipQ</span>
          <span className="navbar-text me-auto d-none d-md-inline">
            Vendor — {user.email}
            {stallName ? ` (${stallName})` : ''}
          </span>
          <NavLink className="nav-link" to="/vendor/menu">
            Menu
          </NavLink>
          <NavLink className="nav-link" to="/vendor/orders">
            Orders
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

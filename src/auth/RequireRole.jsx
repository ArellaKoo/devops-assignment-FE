import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Client-side route gate. It keeps the UI out of a persona's area and gives
// instant feedback, but it is not a security boundary: the backend re-verifies
// the token on every request, so a wrong or missing role is still refused with
// 401/403 no matter what the UI renders.

const ROLE_HOME = { diner: '/diner/stalls', vendor: '/vendor/menu' };

export default function RequireRole({ role, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }
  return children;
}

import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AsyncButton, { useAsyncAction } from '../components/AsyncButton';
import FeedbackBanner from '../components/FeedbackBanner';
import { useFeedback } from '../context/FeedbackContext';

const ROLE_HOME = { diner: '/diner/stalls', vendor: '/vendor/menu' };

// Sign-in for the seeded demo accounts. The backend mints the signed token;
// this page only reports its refusals (unknown account, wrong password,
// lockout) through the shared feedback banner.
export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth();
  const { show } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('diner.one@skipq.test');
  const [password, setPassword] = useState('');

  const { busy, run: signIn } = useAsyncAction(async () => {
    try {
      const nextUser = await login(email.trim(), password);
      const from = location.state && location.state.from;
      // Only honour a return path that matches the persona that signed in.
      if (typeof from === 'string' && from.startsWith(`/${nextUser.role}/`)) {
        navigate(from, { replace: true });
      } else {
        navigate(ROLE_HOME[nextUser.role] || '/login', { replace: true });
      }
    } catch (error) {
      show(error instanceof ApiError ? error.message : 'Sign-in failed. Please try again.');
    }
  });

  if (isAuthenticated) {
    const from = location.state && location.state.from;
    const destination = typeof from === 'string' && from.startsWith(`/${user.role}/`)
      ? from : ROLE_HOME[user.role] || '/login';
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <h1 className="h3 mb-3 text-center">SkipQ sign-in</h1>
          <FeedbackBanner />
          <form onSubmit={(event) => { event.preventDefault(); signIn(); }} className="card">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={busy}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                />
              </div>
              <AsyncButton type="submit" label="Sign in" busyLabel="Signing in…" busy={busy} className="btn btn-primary w-100" />
            </div>
          </form>
          <div className="card mt-3 border-light bg-light">
            <div className="card-body py-2 small">
              <strong>Demo accounts</strong> (seeded; shared local password <code>SkipQDemo2026!</code>):
              <ul className="mb-0 mt-1">
                <li>Diner — <code>diner.one@skipq.test</code> (has current and past orders)</li>
                <li>Diner — <code>diner.two@skipq.test</code></li>
                <li>Diner — <code>diner.empty@skipq.test</code> (no orders)</li>
                <li>Vendor — <code>vendor.one@skipq.test</code> (Charcoal Grill)</li>
                <li>Vendor — <code>vendor.two@skipq.test</code> (Noodle Bar)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

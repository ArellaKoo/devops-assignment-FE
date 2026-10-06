import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ApiError, request } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'skipq.session';

// Per-tab session storage: each browser tab signs in independently, so two
// tabs can hold different personas (diner in one, vendor in the other).
// sessionStorage is used instead of localStorage precisely for that.
function readStoredSession() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.user && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const persist = useCallback((next) => {
    setSession(next);
    if (next === null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Exchanges the seeded account's email/password for the backend's signed
  // Bearer token (POST /api/user/gettoken) and stores persona + token.
  const login = useCallback(
    async (email, password) => {
      const data = await request('/api/user/gettoken', {
        method: 'POST',
        body: { email, password },
      });
      const next = { user: data.persona, token: data.token };
      persist(next);
      return next.user;
    },
    [persist],
  );

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  // Request bound to the current tab's token. When the backend rejects the
  // token (expired or revoked, 401 authentication_required) the session is
  // cleared so RequireRole routes the user back to sign-in.
  const requestAsUser = useCallback(
    async (path, options = {}) => {
      try {
        return await request(path, { token: session ? session.token : undefined, ...options });
      } catch (error) {
        if (error instanceof ApiError && error.expired) persist(null);
        throw error;
      }
    },
    [session, persist],
  );

  const value = useMemo(
    () => ({
      user: session ? session.user : null,
      isAuthenticated: Boolean(session),
      login,
      logout,
      request: requestAsUser,
    }),
    [session, login, logout, requestAsUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

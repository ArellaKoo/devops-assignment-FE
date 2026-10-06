import { API_BASE_URL } from '../config';

// Shared API client for the SkipQ backend.
//
// One fetch wrapper so every page attaches the Bearer token the same way,
// resolves the configured base URL, and receives a typed error instead of a
// raw fetch rejection. The backend's stable error contract is
// {"error": {"code", "message"}}; ApiError exposes all three so screens can
// display the actionable message and branch on the code.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 for a network-level failure (backend down)
    this.code = code; // backend error.code, or 'network_error'
    // True only for the backend's token rejection, so screens can tell an
    // expired session (go sign in) apart from any other 401.
    this.expired = status === 401 && code === 'authentication_required';
  }
}

export async function request(path, options = {}) {
  const { method = 'GET', body, token, signal } = options;
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // Aborting an in-flight request is not a network failure.
    if (error && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'network_error', 'The SkipQ API could not be reached. Is the backend running?');
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const code = data && data.error && data.error.code;
    const message =
      (data && data.error && data.error.message) || `The request failed with status ${response.status}.`;
    throw new ApiError(response.status, code, message);
  }
  return data === null ? {} : data;
}

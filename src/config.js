// Shared runtime configuration for the SkipQ frontend.
//
// The API base URL comes from the configured .env
// (REACT_APP_API_BASE_URL, see .env.example). The documented local default
// is the backend's loopback address, which the backend's CORS allowlist
// expects; every page and the shared API client read this one value.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5001';

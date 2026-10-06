import { Link } from 'react-router-dom';

// Reachable catch-all: unknown paths land here with a way back to sign-in.
export default function NotFoundPage() {
  return (
    <div className="container py-5 text-center">
      <h1 className="h3">Page not found</h1>
      <p className="text-secondary">That address does not exist in SkipQ.</p>
      <Link className="btn btn-primary" to="/login">
        Go to sign-in
      </Link>
    </div>
  );
}

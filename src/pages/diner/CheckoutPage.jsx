import { Link } from 'react-router-dom';

// Stub placeholder: the checkout flow (fingerprint-verified payment, the
// unique checkout key, replay/conflict screens) lands with Task 8.
export default function DinerCheckoutPage() {
  return (
    <section>
      <h2>Checkout</h2>
      <p className="text-secondary">
        The checkout screen arrives with the diner ordering flow.
      </p>
      <Link to="/diner/cart" className="btn btn-outline-primary">
        Back to your cart
      </Link>
    </section>
  );
}

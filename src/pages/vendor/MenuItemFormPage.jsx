import { Link } from 'react-router-dom';

// Stub placeholder: the menu-item create/edit form lands with Task 9.
export default function VendorMenuItemFormPage() {
  return (
    <section>
      <h2>Add menu item</h2>
      <p className="text-secondary">The menu-item form arrives with the vendor trading screen.</p>
      <Link to="/vendor/menu" className="btn btn-outline-primary">
        Back to your menu
      </Link>
    </section>
  );
}

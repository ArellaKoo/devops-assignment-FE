import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import RequireRole from './auth/RequireRole';
import DinerLayout from './layouts/DinerLayout';
import VendorLayout from './layouts/VendorLayout';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import DinerStallsPage from './pages/diner/StallsPage';
import DinerMenuPage from './pages/diner/MenuPage';
import DinerCartPage from './pages/diner/CartPage';
import DinerCheckoutPage from './pages/diner/CheckoutPage';
import DinerOrdersPage from './pages/diner/OrdersPage';
import DinerOrderDetailPage from './pages/diner/OrderDetailPage';
import VendorMenuPage from './pages/vendor/MenuPage';
import VendorMenuItemFormPage from './pages/vendor/MenuItemFormPage';
import VendorOrdersPage from './pages/vendor/OrdersPage';
import VendorOrderDetailPage from './pages/vendor/OrderDetailPage';

// SkipQ routes (design, 2026-10-06): the public login screen, the protected
// diner and vendor persona areas under nested layouts, and the reachable
// not-found view. There is no registration, user administration, or OneMap
// area, and no public order area: every order screen sits behind its
// persona's RequireRole gate.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireRole role="diner">
              <DinerLayout />
            </RequireRole>
          }
        >
          <Route path="/diner/stalls" element={<DinerStallsPage />} />
          <Route path="/diner/stalls/:stallId" element={<DinerMenuPage />} />
          <Route path="/diner/cart" element={<DinerCartPage />} />
          <Route path="/diner/checkout" element={<DinerCheckoutPage />} />
          <Route path="/diner/orders" element={<DinerOrdersPage />} />
          <Route path="/diner/orders/:orderId" element={<DinerOrderDetailPage />} />
        </Route>

        <Route
          element={
            <RequireRole role="vendor">
              <VendorLayout />
            </RequireRole>
          }
        >
          <Route path="/vendor/menu" element={<VendorMenuPage />} />
          <Route path="/vendor/menu/new" element={<VendorMenuItemFormPage />} />
          <Route path="/vendor/menu/:itemId/edit" element={<VendorMenuItemFormPage />} />
          <Route path="/vendor/orders" element={<VendorOrdersPage />} />
          <Route path="/vendor/orders/:orderId" element={<VendorOrderDetailPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useAsyncAction } from '../../components/AsyncButton';

// Create (no :itemId) or edit (with :itemId) a menu item on the own stall.
// The field rules mirror the backend's 400 messages; the server remains the
// final validator and its refusal is shown verbatim on this screen.
export default function VendorMenuItemFormPage() {
  const { itemId } = useParams();
  const editing = Boolean(itemId);
  const navigate = useNavigate();
  const { request } = useAuth();
  const { show } = useFeedback();
  const [item, setItem] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const { busy, run: submit } = useAsyncAction(async () => {
    try {
      const body = { name, price, description, image_url: imageUrl, is_available: isAvailable };
      const payload = await request(
        editing ? `/api/vendor/menu/${itemId}` : '/api/vendor/menu',
        { method: editing ? 'PATCH' : 'POST', body },
      );
      show(
        editing ? `${payload.item.name} was updated.` : `${payload.item.name} was added to your menu.`,
        'success',
      );
      navigate('/vendor/menu');
    } catch (error) {
      show(error.message);
    }
  });

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    // The API has no single-item read, so the form loads the stall's menu
    // list and picks its item out of it; an item that left the menu (soft
    // delete) is not on the list and is reported as removed.
    request('/api/vendor/menu')
      .then((payload) => {
        if (!active) return;
        const entry = payload.items.find((candidate) => candidate.id === itemId);
        if (entry === undefined) {
          setLoadError('That menu item is not on your current menu. It may have been removed.');
          return;
        }
        setItem(entry);
        setName(entry.name);
        setPrice((entry.price_cents / 100).toFixed(2));
        setDescription(entry.description);
        setImageUrl(entry.image_url);
        setIsAvailable(entry.is_available);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, editing]);

  if (editing && loadError !== null) {
    return (
      <section>
        <h2>Edit menu item</h2>
        <p className="text-secondary">{loadError}</p>
        <Link to="/vendor/menu" className="btn btn-outline-primary">
          Back to your menu
        </Link>
      </section>
    );
  }

  if (editing && item === null) {
    return (
      <section>
        <h2>Edit menu item</h2>
        <p className="text-secondary">Loading the item…</p>
      </section>
    );
  }

  return (
    <section>
      <h2>{editing ? 'Edit menu item' : 'Add menu item'}</h2>
      <p className="text-secondary">
        Rules: name 1–80 characters; price above 0 and below 9999 with at most two decimal
        places; description up to 500 characters; image an http(s) URL for a JPG, JPEG, or PNG.
      </p>
      <form
        className="col-md-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="mb-3">
          <label className="form-label" htmlFor="item-name">
            Name
          </label>
          <input
            id="item-name"
            className="form-control"
            value={name}
            maxLength={80}
            required
            placeholder="Charcoal Chicken Rice"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="item-price">
            Price
          </label>
          <input
            id="item-price"
            className="form-control"
            value={price}
            inputMode="decimal"
            required
            placeholder="6.50"
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="item-description">
            Description
          </label>
          <textarea
            id="item-description"
            className="form-control"
            rows={3}
            maxLength={500}
            value={description}
            placeholder="What the dish is."
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="item-image">
            Image URL
          </label>
          <input
            id="item-image"
            className="form-control"
            value={imageUrl}
            required
            placeholder="https://example.com/images/item.png"
            onChange={(event) => setImageUrl(event.target.value)}
          />
        </div>
        <div className="form-check mb-3">
          <input
            id="item-available"
            type="checkbox"
            className="form-check-input"
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
          />
          <label className="form-check-label" htmlFor="item-available">
            Available now (diners can add it to a cart)
          </label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save item' : 'Add item'}
          </button>
          <Link to="/vendor/menu" className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

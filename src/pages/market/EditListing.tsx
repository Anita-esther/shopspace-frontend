import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import PhotoUploadField from '../../components/PhotoUploadField';

interface Category {
  category_id: number;
  name: string;
}

interface Product {
  product_id: number;
  title: string;
  description: string | null;
  price: string;
  image_url: string | null;
  category_id: number;
  condition: string;
  seller_id: number;
}

const EditListing: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notAllowed, setNotAllowed] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('used_good');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((res) => setCategories(res.categories));
  }, []);

  useEffect(() => {
    api
      .get<{ product: Product }>(`/products/${productId}`)
      .then((res) => {
        const p = res.product;
        if (user && p.seller_id !== user.user_id) {
          setNotAllowed(true);
          return;
        }
        setTitle(p.title);
        setDescription(p.description || '');
        setPrice(String(p.price));
        setCategoryId(String(p.category_id));
        setCondition(p.condition);
        setExistingImageUrl(p.image_url);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [productId, user]);

  const handlePhotoChange = (file: File | null, removedExisting: boolean) => {
    setImageFile(file);
    setImageRemoved(removedExisting);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Only send image_url when the photo actually changed:
      // - a new file was picked -> upload it, send the new URL
      // - the existing photo was explicitly removed -> send null to clear it
      // - otherwise -> omit the field entirely so the current photo is kept
      let imageUrl: string | null | undefined;

      if (imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const uploadRes = await api.upload<{ url: string }>('/uploads/image', formData, { auth: true });
          imageUrl = uploadRes.url;
        } finally {
          setUploadingImage(false);
        }
      } else if (imageRemoved) {
        imageUrl = null;
      }

      await api.put(
        `/products/${productId}`,
        {
          title,
          description,
          price: Number(price),
          category_id: Number(categoryId),
          condition,
          ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
        },
        { auth: true }
      );
      navigate(`/market/product/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <header className="ss-page-header">
      <Link to="/market/mine" className="ss-back-btn" aria-label="Back to my listings">
        <i className="ti ti-arrow-left" aria-hidden="true"></i>
      </Link>
      <h1>Edit listing</h1>
    </header>
  );

  if (loading) {
    return (
      <div className="market-page-outer">
        <div className="market-page ss-narrow">
          {header}
          <div className="create-listing-page">
            <p className="market-status">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notAllowed || loadError) {
    return (
      <div className="market-page-outer">
        <div className="market-page ss-narrow">
          {header}
          <div className="create-listing-page">
            <p className="market-status">
              {notAllowed ? "You can only edit your own listings." : loadError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="market-page-outer">
      <div className="market-page ss-narrow">
        {header}

        <div className="create-listing-page">
          <form className="create-listing-form" onSubmit={handleSubmit}>
            <label className="auth-label" htmlFor="title">Title</label>
            <input
              id="title"
              className="auth-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label className="auth-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="auth-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="auth-label" htmlFor="price">Price (\u20a6)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className="auth-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <label className="auth-label" htmlFor="category">Category</label>
            <select
              id="category"
              className="auth-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>

            <label className="auth-label" htmlFor="condition">Condition</label>
            <select
              id="condition"
              className="auth-input"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="new">New</option>
              <option value="used_like_new">Used - Like New</option>
              <option value="used_good">Used - Good</option>
              <option value="used_fair">Used - Fair</option>
            </select>

            <PhotoUploadField existingImageUrl={existingImageUrl} onChange={handlePhotoChange} />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-button" disabled={busy || !title || !price}>
              {uploadingImage ? 'Uploading photo...' : busy ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditListing;

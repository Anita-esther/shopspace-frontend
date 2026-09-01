import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Category {
  category_id: number;
  name: string;
}

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('used_good');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((res) => {
      setCategories(res.categories);
      if (res.categories.length > 0) setCategoryId(String(res.categories[0].category_id));
    });
  }, []);

  // Revoke the local preview URL when it's replaced or the component unmounts,
  // so we don't leak object URLs.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be under 5MB');
      return;
    }

    setError(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let imageUrl: string | undefined;

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
      }

      const res = await api.post<{ product: { product_id: number } }>(
        '/products',
        {
          title,
          description,
          price: Number(price),
          category_id: Number(categoryId),
          condition,
          image_url: imageUrl,
        },
        { auth: true }
      );
      navigate(`/market/product/${res.product.product_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="market-page-outer">
      <div className="market-page ss-narrow">
        <header className="ss-page-header">
          <Link to="/market" className="ss-back-btn" aria-label="Back to market">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </Link>
          <h1>Sell an item</h1>
        </header>

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

            <label className="auth-label" htmlFor="photo">Photo (optional)</label>
            {imagePreview ? (
              <div className="listing-photo-preview">
                <img src={imagePreview} alt="Selected item preview" />
                <button
                  type="button"
                  className="listing-photo-remove"
                  onClick={handleRemoveImage}
                  aria-label="Remove photo"
                >
                  <i className="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>
            ) : (
              <label className="listing-photo-dropzone" htmlFor="photo">
                <i className="ti ti-camera-plus" aria-hidden="true"></i>
                <span>Tap to add a photo</span>
              </label>
            )}
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="listing-photo-input"
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-button" disabled={busy || !title || !price}>
              {uploadingImage ? 'Uploading photo...' : busy ? 'Posting...' : 'Post Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { categoryIcon } from '../../lib/categoryIcon';

interface MyProduct {
  product_id: number;
  title: string;
  price: string;
  image_url: string | null;
  category_name: string;
  status: 'available' | 'sold' | 'removed';
}

const formatMoney = (price: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(
    Number(price)
  );

const MyListings: React.FC = () => {
  const [products, setProducts] = useState<MyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    api
      .get<{ products: MyProduct[] }>('/products/mine', { auth: true })
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkSold = async (id: number) => {
    setBusyId(id);
    try {
      await api.put(`/products/${id}`, { status: 'sold' }, { auth: true });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleRelist = async (id: number) => {
    setBusyId(id);
    try {
      await api.put(`/products/${id}`, { status: 'available' }, { auth: true });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.delete(`/products/${id}`, { auth: true });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="market-page-outer">
      <div className="market-page ss-medium">
        <header className="ss-page-header">
          <Link to="/market" className="ss-back-btn" aria-label="Back to market">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </Link>
          <h1>My listings</h1>
        </header>

        <div className="my-listings-page">
          {loading ? (
            <p className="market-status">Loading your listings...</p>
          ) : products.length === 0 ? (
            <p className="market-status">
              You haven't posted anything yet. <Link to="/market/new">Sell your first item</Link>
            </p>
          ) : (
            <div className="my-listings-list">
              {products.map((p) => (
                <div key={p.product_id} className="my-listing-row">
                  <div className="my-listing-image">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} />
                    ) : (
                      <i className={`ti ${categoryIcon(p.category_name)}`} aria-hidden="true"></i>
                    )}
                  </div>
                  <div className="my-listing-body">
                    <div className="my-listing-title">{p.title}</div>
                    <div className="my-listing-price">{formatMoney(p.price)}</div>
                    <span className={`my-listing-status my-listing-status-${p.status}`}>
                      {p.status === 'available' ? 'Available' : p.status === 'sold' ? 'Sold' : 'Removed'}
                    </span>
                  </div>
                  <div className="my-listing-actions">
                    <Link to={`/market/edit/${p.product_id}`} className="market-btn-ghost">
                      Edit
                    </Link>
                    {p.status === 'available' && (
                      <button
                        className="market-btn-ghost"
                        disabled={busyId === p.product_id}
                        onClick={() => handleMarkSold(p.product_id)}
                      >
                        Mark sold
                      </button>
                    )}
                    {p.status === 'sold' && (
                      <button
                        className="market-btn-ghost"
                        disabled={busyId === p.product_id}
                        onClick={() => handleRelist(p.product_id)}
                      >
                        Relist
                      </button>
                    )}
                    <button
                      className="market-btn-ghost my-listing-delete"
                      disabled={busyId === p.product_id}
                      onClick={() => handleDelete(p.product_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListings;

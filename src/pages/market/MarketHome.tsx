import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { categoryIcon } from '../../lib/categoryIcon';

interface Product {
  product_id: number;
  title: string;
  price: string;
  image_url: string | null;
  category_name: string;
  condition: string;
}

interface Category {
  category_id: number;
  name: string;
}

const formatMoney = (price: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(
    Number(price)
  );

const MarketHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((res) => setCategories(res.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('category_id', categoryId);

    api
      .get<{ products: Product[] }>(`/products?${params.toString()}`)
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  }, [search, categoryId]);

  const handleCategoryIconClick = (id: string) => {
    // Clicking the already-selected category clears the filter (acts as a toggle)
    setCategoryId((current) => (current === id ? '' : id));
  };

  return (
    <div className="market-page-outer">
      <div className="market-page">
        <header className="market-header">
          <div className="market-header-top">
            <h1>ShopSpace</h1>
            <button
              className="market-menu-toggle"
              aria-label="Menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true"></i>
            </button>
          </div>

          <div className={`market-header-actions ${menuOpen ? 'open' : ''}`}>
            <span className="market-user">Hi, {user?.full_name?.split(' ')[0]}</span>
            <Link to="/chats" className="market-btn-ghost">Chats</Link>
            <Link to="/transactions" className="market-btn-ghost">Transactions</Link>
            <Link to="/profile" className="market-btn-ghost">Profile</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="market-btn-ghost">Admin</Link>
            )}
            <Link to="/market/new" className="market-btn-primary">+ Sell an item</Link>
            <button className="market-btn-ghost" onClick={logout}>Log out</button>
          </div>
        </header>

        <div className="market-search-bar">
          <i className="ti ti-search market-search-icon" aria-hidden="true"></i>
          <input
            type="text"
            placeholder="Search for textbooks, electronics..."
            className="market-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="market-category-row">
          <button
            className={`market-category-icon ${categoryId === '' ? 'active' : ''}`}
            onClick={() => setCategoryId('')}
          >
            <span className="market-category-icon-circle">
              <i className="ti ti-apps" aria-hidden="true"></i>
            </span>
            <span className="market-category-icon-label">All</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.category_id}
              className={`market-category-icon ${categoryId === String(c.category_id) ? 'active' : ''}`}
              onClick={() => handleCategoryIconClick(String(c.category_id))}
            >
              <span className="market-category-icon-circle">
                <i className={`ti ${categoryIcon(c.name)}`} aria-hidden="true"></i>
              </span>
              <span className="market-category-icon-label">{c.name}</span>
            </button>
          ))}
        </div>

        <div className="market-filters">
          <select
            className="market-category-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="market-status">Loading listings...</p>
        ) : products.length === 0 ? (
          <p className="market-status">No products found. Try a different search.</p>
        ) : (
          <div className="market-grid">
            {products.map((p) => (
              <div
                key={p.product_id}
                className="market-card"
                onClick={() => navigate(`/market/product/${p.product_id}`)}
              >
                <div className="market-card-image">
                  <span className="market-card-tag">{p.category_name}</span>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} />
                  ) : (
                    <div className="market-card-placeholder">
                      <i className={`ti ${categoryIcon(p.category_name)}`} aria-hidden="true"></i>
                    </div>
                  )}
                </div>
                <div className="market-card-body">
                  <div className="market-card-title">{p.title}</div>
                  <div className="market-card-price">{formatMoney(p.price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketHome;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Stats {
  total_users: number;
  suspended_users: number;
  total_products: number;
  available_products: number;
  sold_products: number;
  completed_transactions: number;
}

interface AdminUser {
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  matric_number: string | null;
  role: 'student' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
}

interface AdminProduct {
  product_id: number;
  title: string;
  price: string;
  status: string;
  image_url: string | null;
  category_name: string;
  seller_name: string;
  seller_email: string;
  created_at: string;
}

const formatMoney = (price: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(
    Number(price)
  );

type Tab = 'overview' | 'users' | 'listings';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<{ stats: Stats }>('/admin/stats', { auth: true }),
      api.get<{ users: AdminUser[] }>('/admin/users', { auth: true }),
      api.get<{ products: AdminProduct[] }>('/admin/products', { auth: true }),
    ])
      .then(([statsRes, usersRes, productsRes]) => {
        setStats(statsRes.stats);
        setUsers(usersRes.users);
        setProducts(productsRes.products);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const handleToggleUserStatus = async (u: AdminUser) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    const verb = nextStatus === 'suspended' ? 'Suspend' : 'Reactivate';
    if (!confirm(`${verb} ${u.full_name}?`)) return;

    setBusyId(u.user_id);
    try {
      await api.put(`/admin/users/${u.user_id}/status`, { status: nextStatus }, { auth: true });
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, status: nextStatus } : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveProduct = async (p: AdminProduct) => {
    if (!confirm(`Remove "${p.title}"? This can't be undone.`)) return;

    setBusyId(p.product_id);
    try {
      await api.delete(`/products/${p.product_id}`, { auth: true });
      setProducts((prev) => prev.filter((x) => x.product_id !== p.product_id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove listing');
    } finally {
      setBusyId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.seller_name.toLowerCase().includes(q) ||
      p.seller_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="market-page-outer">
      <div className="market-page ss-medium">
        <header className="ss-page-header">
          <Link to="/market" className="ss-back-btn" aria-label="Back to market">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </Link>
          <h1>Admin Dashboard</h1>
        </header>

        <div className="admin-page">
          <div className="admin-tabs">
            <button
              className={`admin-tab ${tab === 'overview' ? 'admin-tab-active' : ''}`}
              onClick={() => setTab('overview')}
            >
              Overview
            </button>
            <button
              className={`admin-tab ${tab === 'users' ? 'admin-tab-active' : ''}`}
              onClick={() => setTab('users')}
            >
              Users
            </button>
            <button
              className={`admin-tab ${tab === 'listings' ? 'admin-tab-active' : ''}`}
              onClick={() => setTab('listings')}
            >
              Listings
            </button>
          </div>

          {loading ? (
            <p className="market-status">Loading...</p>
          ) : error ? (
            <p className="market-status">{error}</p>
          ) : (
            <>
              {tab === 'overview' && stats && (
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div className="admin-stat-number">{stats.total_users}</div>
                    <div className="admin-stat-label">Total students</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-number">{stats.total_products}</div>
                    <div className="admin-stat-label">Total listings</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-number">{stats.available_products}</div>
                    <div className="admin-stat-label">Available now</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-number">{stats.completed_transactions}</div>
                    <div className="admin-stat-label">Completed sales</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-number">{stats.sold_products}</div>
                    <div className="admin-stat-label">Sold listings</div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="admin-stat-number">{stats.suspended_users}</div>
                    <div className="admin-stat-label">Suspended users</div>
                  </div>
                </div>
              )}

              {tab === 'users' && (
                <div className="admin-section">
                  <div className="admin-search-bar">
                    <i className="ti ti-search" aria-hidden="true"></i>
                    <input
                      className="admin-search-input"
                      placeholder="Search by name or email"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  {filteredUsers.length === 0 ? (
                    <p className="market-status">No users found.</p>
                  ) : (
                    <div className="admin-list">
                      {filteredUsers.map((u) => (
                        <div key={u.user_id} className="admin-user-row">
                          <div className="admin-row-body">
                            <div className="admin-row-title">{u.full_name}</div>
                            <div className="admin-row-meta">{u.email}</div>
                          </div>
                          <div className="admin-row-actions">
                            <span className={`admin-status-badge admin-status-${u.status}`}>
                              {u.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                            {u.role !== 'admin' && (
                              <button
                                className={`admin-action-btn ${
                                  u.status === 'active' ? 'admin-action-danger' : 'admin-action-positive'
                                }`}
                                disabled={busyId === u.user_id}
                                onClick={() => handleToggleUserStatus(u)}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'listings' && (
                <div className="admin-section">
                  <div className="admin-search-bar">
                    <i className="ti ti-search" aria-hidden="true"></i>
                    <input
                      className="admin-search-input"
                      placeholder="Search by title or seller"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  {filteredProducts.length === 0 ? (
                    <p className="market-status">No listings found.</p>
                  ) : (
                    <div className="admin-list">
                      {filteredProducts.map((p) => (
                        <div key={p.product_id} className="admin-product-row">
                          <div className="admin-product-image">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.title} />
                            ) : (
                              <i className="ti ti-photo" aria-hidden="true"></i>
                            )}
                          </div>
                          <div className="admin-row-body">
                            <div className="admin-row-title">{p.title}</div>
                            <div className="admin-row-meta">
                              by {p.seller_name} &middot; {formatMoney(p.price)}
                            </div>
                            <span className={`admin-status-badge admin-status-${p.status}`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </span>
                          </div>
                          <div className="admin-row-actions">
                            <button
                              className="admin-action-btn admin-action-danger"
                              disabled={busyId === p.product_id}
                              onClick={() => handleRemoveProduct(p)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

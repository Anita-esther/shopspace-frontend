import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { categoryIcon } from '../../lib/categoryIcon';

interface Product {
  product_id: number;
  title: string;
  description: string | null;
  price: string;
  image_url: string | null;
  category_name: string;
  condition: string;
  status: 'available' | 'sold' | 'removed';
  seller_id: number;
  seller_name: string;
}

const formatMoney = (price: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(
    Number(price)
  );

const conditionLabels: Record<string, string> = {
  new: 'New',
  used_like_new: 'Used - Like New',
  used_good: 'Used - Good',
  used_fair: 'Used - Fair',
};

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTransaction, setStartingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ product: Product }>(`/products/${productId}`)
      .then((res) => setProduct(res.product))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const isOwnListing = user && product && user.user_id === product.seller_id;

  const handleMessageSeller = () => {
    navigate(`/chat/${product?.seller_id}?product=${product?.product_id}`);
  };

  const handleMarkPurchased = async () => {
    if (!product) return;
    setTransactionError(null);
    setStartingTransaction(true);
    try {
      await api.post(
        '/transactions',
        { product_id: product.product_id, agreed_price: product.price },
        { auth: true }
      );
      navigate('/transactions');
    } catch (err) {
      setTransactionError(err instanceof Error ? err.message : 'Failed to start transaction');
    } finally {
      setStartingTransaction(false);
    }
  };

  const header = (
    <header className="ss-page-header">
      <Link to="/market" className="ss-back-btn" aria-label="Back to market">
        <i className="ti ti-arrow-left" aria-hidden="true"></i>
      </Link>
      <h1>Item details</h1>
    </header>
  );

  if (loading) {
    return (
      <div className="market-page-outer">
        <div className="market-page ss-medium">
          {header}
          <div className="product-detail-page">
            <div className="market-status">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="market-page-outer">
        <div className="market-page ss-medium">
          {header}
          <div className="product-detail-page">
            <div className="market-status">Product not found.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="market-page-outer">
      <div className="market-page ss-medium">
        {header}

        <div className="product-detail-page">
          <div className="product-detail-image">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} />
            ) : (
              <div className="market-card-placeholder">
                <i className={`ti ${categoryIcon(product.category_name)}`} aria-hidden="true"></i>
              </div>
            )}
          </div>

          <div className="product-detail-body">
            <h1>{product.title}</h1>
            <div className="product-detail-price">{formatMoney(product.price)}</div>
            <div className="product-detail-meta">
              <span>{product.category_name}</span>
              <span>&middot;</span>
              <span>{conditionLabels[product.condition] || product.condition}</span>
            </div>

            <p className="product-detail-description">
              {product.description || 'No description provided.'}
            </p>

            <div className="product-detail-seller">
              Sold by <strong>{product.seller_name}</strong>
            </div>

            {!isOwnListing && product.status === 'available' && (
              <div className="product-detail-cta-group">
                <button className="market-btn-primary product-detail-cta" onClick={handleMessageSeller}>
                  Message Seller
                </button>
                <button
                  className="market-btn-ghost product-detail-cta"
                  disabled={startingTransaction}
                  onClick={handleMarkPurchased}
                >
                  {startingTransaction ? 'Starting...' : "I've bought this"}
                </button>
                {transactionError && <p className="auth-error">{transactionError}</p>}
              </div>
            )}
            {!isOwnListing && product.status === 'sold' && (
              <p className="product-detail-own-note">This item has already been sold.</p>
            )}
            {isOwnListing && (
              <p className="product-detail-own-note">This is your own listing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

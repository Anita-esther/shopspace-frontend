import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';

interface Transaction {
  transaction_id: number;
  product_id: number;
  product_title: string;
  product_image_url: string | null;
  buyer_id: number;
  seller_id: number;
  buyer_name: string;
  seller_name: string;
  agreed_price: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  reviewed_by_me: number | boolean;
}

const formatMoney = (price: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(
    Number(price)
  );

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Review form state, keyed to whichever transaction row currently has the
  // form open (only one at a time).
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = () => {
    api
      .get<{ transactions: Transaction[] }>('/transactions/mine', { auth: true })
      .then((res) => setTransactions(res.transactions))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleComplete = async (id: number) => {
    setBusyId(id);
    try {
      await api.put(`/transactions/${id}/complete`, undefined, { auth: true });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this transaction?')) return;
    setBusyId(id);
    try {
      await api.put(`/transactions/${id}/cancel`, undefined, { auth: true });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const openReviewForm = (id: number) => {
    setReviewingId(id);
    setReviewRating(0);
    setReviewComment('');
    setReviewError(null);
  };

  const closeReviewForm = () => {
    setReviewingId(null);
  };

  const submitReview = async (transactionId: number) => {
    if (reviewRating === 0) {
      setReviewError('Please choose a star rating');
      return;
    }
    setReviewError(null);
    setSubmittingReview(true);
    try {
      await api.post(
        '/reviews',
        { transaction_id: transactionId, rating: reviewRating, comment: reviewComment || undefined },
        { auth: true }
      );
      setReviewingId(null);
      load();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="market-page-outer">
      <div className="market-page ss-medium">
        <header className="ss-page-header">
          <Link to="/market" className="ss-back-btn" aria-label="Back to market">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </Link>
          <h1>Transactions</h1>
        </header>

        <div className="transactions-page">
          {loading ? (
            <p className="market-status">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="market-status">No transactions yet.</p>
          ) : (
            <div className="transactions-list">
              {transactions.map((t) => {
                const isBuyer = user?.user_id === t.buyer_id;
                const otherPartyName = isBuyer ? t.seller_name : t.buyer_name;
                const isReviewing = reviewingId === t.transaction_id;
                return (
                  <div key={t.transaction_id} className="transaction-row">
                    <div className="transaction-image">
                      {t.product_image_url ? (
                        <img src={t.product_image_url} alt={t.product_title} />
                      ) : (
                        <i className="ti ti-photo" aria-hidden="true"></i>
                      )}
                    </div>
                    <div className="transaction-body">
                      <div className="transaction-title">{t.product_title}</div>
                      <div className="transaction-meta">
                        {isBuyer ? 'Buying from' : 'Selling to'} <strong>{otherPartyName}</strong>
                      </div>
                      <div className="transaction-price">{formatMoney(t.agreed_price)}</div>
                      <span className={`transaction-status transaction-status-${t.status}`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>

                      {t.status === 'completed' && (
                        <>
                          {isReviewing ? (
                            <div className="review-form">
                              <div className="review-form-label">Rate {otherPartyName}</div>
                              <StarRating value={reviewRating} onChange={setReviewRating} size={22} />
                              <textarea
                                className="auth-input review-form-comment"
                                placeholder="How did it go? (optional)"
                                rows={2}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                              />
                              {reviewError && <p className="auth-error">{reviewError}</p>}
                              <div className="review-form-actions">
                                <button
                                  type="button"
                                  className="market-btn-primary"
                                  disabled={submittingReview}
                                  onClick={() => submitReview(t.transaction_id)}
                                >
                                  {submittingReview ? 'Submitting...' : 'Submit review'}
                                </button>
                                <button
                                  type="button"
                                  className="market-btn-ghost"
                                  disabled={submittingReview}
                                  onClick={closeReviewForm}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : t.reviewed_by_me ? (
                            <div className="review-reviewed-tag">
                              <i className="ti ti-check" aria-hidden="true"></i> You reviewed this
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="market-btn-primary review-leave-btn"
                              onClick={() => openReviewForm(t.transaction_id)}
                            >
                              Leave a review
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {t.status === 'pending' && (
                      <div className="transaction-actions">
                        <button
                          className="market-btn-primary"
                          disabled={busyId === t.transaction_id}
                          onClick={() => handleComplete(t.transaction_id)}
                        >
                          Confirm complete
                        </button>
                        <button
                          className="market-btn-ghost transaction-cancel"
                          disabled={busyId === t.transaction_id}
                          onClick={() => handleCancel(t.transaction_id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;

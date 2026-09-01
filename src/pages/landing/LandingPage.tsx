import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Logged-in visitors skip the pitch and go straight to the market
  if (!loading && user) {
    return <Navigate to="/market" replace />;
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <i className="ti ti-building-store" aria-hidden="true"></i>
          ShopSpace
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-login">Log in</Link>
          <Link to="/register" className="landing-nav-signup">Sign up</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <span className="landing-eyebrow">For UNICAL students</span>
        <h1>
          Buy and sell within campus,
          <br />
          without the wahala
        </h1>
        <p>
          Textbooks, gadgets, hostel furniture and more &mdash; trade directly
          with fellow UNICAL students, no middlemen.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="market-btn-primary landing-cta">Get started</Link>
          <Link to="/login" className="landing-cta-secondary">Browse the market</Link>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <i className="ti ti-tag" aria-hidden="true"></i>
          </div>
          <div className="landing-feature-title">Post in minutes</div>
          <p className="landing-feature-body">Snap a photo, set a price, done.</p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <i className="ti ti-message-circle-2" aria-hidden="true"></i>
          </div>
          <div className="landing-feature-title">Chat directly</div>
          <p className="landing-feature-body">Message sellers, agree, meet up.</p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <i className="ti ti-shield-check" aria-hidden="true"></i>
          </div>
          <div className="landing-feature-title">Verified students</div>
          <p className="landing-feature-body">Trade with people on your campus.</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

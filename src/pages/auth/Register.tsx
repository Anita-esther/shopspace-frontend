import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber || undefined,
        matric_number: matricNumber || undefined,
      });
      navigate('/market', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <div className="auth-brand">
          <div className="auth-logo">SS</div>
          <h1>Join ShopSpace</h1>
          <p className="auth-tagline">Your campus marketplace</p>
        </div>

        <label className="auth-label" htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          type="text"
          className="auth-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label className="auth-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="auth-label" htmlFor="phoneNumber">Phone number (optional)</label>
        <input
          id="phoneNumber"
          type="tel"
          className="auth-input"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <label className="auth-label" htmlFor="matricNumber">Matric number (optional)</label>
        <input
          id="matricNumber"
          type="text"
          className="auth-input"
          value={matricNumber}
          onChange={(e) => setMatricNumber(e.target.value)}
        />

        <label className="auth-label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button
          type="submit"
          className="auth-button"
          disabled={busy || !email || !password || !fullName}
        >
          {busy ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const initialEmail = params.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        // Backend returns { success, message, user, token }
        // Use existing login logic to store user + token and update context
        const payload = { ...data.user, token: data.token };
        login(payload);
        navigate('/');
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP resent. Please check your email.');
      } else {
        setMessage(data.message || 'Could not resend OTP');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while resending OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Verify Email</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
        <button type="button" className="btn" onClick={handleResend} disabled={loading} style={{ marginTop: '10px' }}>Resend OTP</button>
        {message && <p style={{ color: 'red' }}>{message}</p>}
        <p>Already verified? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
};

export default VerifyOTP;

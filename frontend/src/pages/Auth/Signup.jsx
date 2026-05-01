import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, ArrowLeft, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const { registerAsUser, registerAsPartner, loading } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    name: '',
    contactName: '',
    phone: '',
    address: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role === 'user') {
      if (!form.fullName || !form.email || !form.password) {
        setError('All fields are required');
        return;
      }
      const result = await registerAsUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      if (result.success) navigate('/home');
      else setError(result.message);
    } else {
      if (!form.name || !form.contactName || !form.email || !form.password || !form.phone || !form.address) {
        setError('All fields are required');
        return;
      }
      const result = await registerAsPartner({
        name: form.name,
        contactName: form.contactName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      });
      if (result.success) navigate('/home');
      else setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient" />
      <div className="auth-bg-pattern" />

      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button className="auth-back-btn" onClick={() => navigate(`/login?role=${role}`)}>
          <ArrowLeft size={20} />
        </button>

        <div className="auth-card-header">
          <div className="auth-logo-mini">🍕</div>
          <h2>Create account</h2>
          <p>Join FoodGram as a {role === 'partner' ? 'food vendor' : 'foodie'}</p>
        </div>

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {role === 'user' ? (
            /* ---- User Fields ---- */
            <>
              <div className="auth-input-group">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>
            </>
          ) : (
            /* ---- Partner Fields ---- */
            <>
              <div className="auth-input-group">
                <Building2 size={18} className="auth-input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="Business name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-input-group">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  name="contactName"
                  placeholder="Contact person name"
                  value={form.contactName}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-input-group">
                <Phone size={18} className="auth-input-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-input-group">
                <MapPin size={18} className="auth-input-icon" />
                <input
                  type="text"
                  name="address"
                  placeholder="Business address"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="auth-input-group">
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-toggle-pw"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to={`/login?role=${role}`} className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const { loginAsUser, loginAsPartner, loading } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('All fields are required');
      return;
    }

    const result = role === 'partner'
      ? await loginAsPartner(form)
      : await loginAsUser(form);

    if (result.success) {
      navigate('/home');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button className="auth-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>

        <div className="auth-card-header">
          <div className="auth-logo-mini">🍕</div>
          <h2>Welcome back</h2>
          <p>Sign in to your {role === 'partner' ? 'vendor' : 'foodie'} account</p>
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
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
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
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to={`/signup?role=${role}`} className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

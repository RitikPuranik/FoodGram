import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Store } from 'lucide-react';
import './Auth.css';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient" />
      <div className="auth-bg-pattern" />

      <motion.div
        className="role-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="role-header minimalist-header">
          <h1 className="minimalist-title brand-name">{import.meta.env.VITE_APP_NAME || 'FoodGram'}</h1>
          <p>Choose your experience</p>
        </div>

        <div className="role-cards minimalist-cards">
          <motion.button
            className="role-card minimalist-card"
            onClick={() => navigate('/login?role=user')}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="minimalist-icon-wrapper">
              <UtensilsCrossed size={28} strokeWidth={1.5} />
            </div>
            <h3>Foodie</h3>
            <p>Explore recipes, save favorites, and share your taste</p>
          </motion.button>

          <motion.button
            className="role-card minimalist-card partner-card"
            onClick={() => navigate('/login?role=partner')}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="minimalist-icon-wrapper partner-icon">
              <Store size={28} strokeWidth={1.5} />
            </div>
            <h3>Vendor</h3>
            <p>Showcase creations, grow your audience, and get noticed</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

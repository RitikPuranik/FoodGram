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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="role-header">
          <motion.div
            className="role-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            🍕
          </motion.div>
          <h1 className="gradient-text">FoodGram</h1>
          <p>Discover, share & savor food moments</p>
        </div>

        <div className="role-cards">
          <motion.button
            className="role-card"
            onClick={() => navigate('/login?role=user')}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="role-card-icon">
              <UtensilsCrossed size={32} />
            </div>
            <h3>I'm a Foodie</h3>
            <p>Explore delicious food videos, save favorites, and discover new flavors</p>
            <div className="role-card-arrow">→</div>
          </motion.button>

          <motion.button
            className="role-card role-card-partner"
            onClick={() => navigate('/login?role=partner')}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="role-card-icon partner-icon">
              <Store size={32} />
            </div>
            <h3>I'm a Food Vendor</h3>
            <p>Showcase your culinary creations, grow your audience, and get noticed</p>
            <div className="role-card-arrow">→</div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

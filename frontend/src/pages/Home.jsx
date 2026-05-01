import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { getFoodItems } from '../api/food';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import './Home.css';

const categories = [
  { id: 'all', label: 'For You', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'hot', label: 'Hot Now', icon: Flame },
  { id: 'recent', label: 'Recent', icon: Clock },
];

export default function Home() {
  const { user, role } = useAuth();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const res = await getFoodItems();
      setFoods(res.data.foodItems || []);
    } catch (err) {
      console.error('Fetch foods error:', err);
    }
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Simulate categories by shuffling
  const displayedFoods = activeCategory === 'all'
    ? foods
    : [...foods].sort(() => Math.random() - 0.5);

  const featuredFood = displayedFoods[0];
  const gridFoods = displayedFoods.slice(1);

  return (
    <div className="home-page">
      {/* Header */}
      <motion.header
        className="home-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="home-header-left">
          <h1 className="home-greeting">
            {getGreeting()}, <span className="gradient-text">{user?.fullName || user?.name || 'Foodie'}</span>
          </h1>
          <p className="home-subtitle">What are you craving today?</p>
        </div>
        <div className="home-user-avatar">
          {(user?.fullName || user?.name || 'U').charAt(0).toUpperCase()}
        </div>
      </motion.header>

      {/* Category Pills */}
      <motion.div
        className="home-categories"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </motion.div>

      {loading ? (
        <Loader text="Loading delicious content..." />
      ) : foods.length === 0 ? (
        <motion.div
          className="home-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="home-empty-icon">🍽️</div>
          <h3>No food posts yet</h3>
          <p>
            {role === 'partner'
              ? 'Upload your first food video to get started!'
              : 'Check back soon for delicious content!'}
          </p>
        </motion.div>
      ) : (
        <div className="home-feed">
          {/* Featured Hero Post */}
          {featuredFood && (
            <motion.div
              className="home-featured"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="featured-badge">
                <Flame size={14} />
                <span>Featured</span>
              </div>
              <PostCard food={featuredFood} index={0} />
            </motion.div>
          )}

          {/* Grid Feed */}
          <div className="home-grid">
            {gridFoods.map((food, i) => (
              <PostCard key={food._id} food={food} index={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

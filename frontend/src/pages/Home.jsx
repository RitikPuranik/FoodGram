import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { getFoodItems } from '../api/food';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import EndOfFeed from '../components/EndOfFeed';
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();

  const lastFoodElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchFoods(page);
  }, [page]);

  const fetchFoods = async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getFoodItems(pageNum, 20);
      const newFoods = res.data.foodItems || [];
      setFoods(prev => pageNum === 1 ? newFoods : [...prev, ...newFoods]);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error('Fetch foods error:', err);
    }
    
    setLoading(false);
    setLoadingMore(false);
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
          {displayedFoods.length > 0 && (
            <motion.div
              key={displayedFoods[0]._id}
              ref={displayedFoods.length === 1 ? lastFoodElementRef : null}
              className="home-featured"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="featured-badge">
                <Flame size={14} />
                <span>Featured</span>
              </div>
              <PostCard food={displayedFoods[0]} index={0} />
            </motion.div>
          )}

          {displayedFoods.length > 1 && (
            <div className="home-grid">
              {displayedFoods.slice(1).map((gridFood, gridIdx) => {
                const realIdx = gridIdx + 1;
                const isLastInGrid = realIdx === displayedFoods.length - 1;
                return (
                  <div
                    key={gridFood._id}
                    ref={isLastInGrid ? lastFoodElementRef : null}
                    className="home-grid-item"
                  >
                    <PostCard food={gridFood} index={realIdx} />
                  </div>
                );
              })}
            </div>
          )}

          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <Loader size="small" />
            </div>
          )}
          {!hasMore && foods.length > 0 && <EndOfFeed />}
        </div>
      )}
    </div>
  );
}

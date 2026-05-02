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
          {displayedFoods.map((food, i) => {
            const isLast = i === displayedFoods.length - 1;
            const isFeatured = i === 0;
            const showCaughtUp = i > 0 && displayedFoods[i-1].isFollowed === 1 && food.isFollowed === 0;

            const content = (
              <>
                {showCaughtUp && (
                  <div key="caught-up-middle" style={{ gridColumn: '1 / -1' }}>
                    <EndOfFeed message="You've seen all from your follows!" />
                    <div className="feed-divider">
                      <span>More for you</span>
                    </div>
                  </div>
                )}
                {isFeatured ? (
                  <motion.div
                    key={food._id}
                    ref={isLast ? lastFoodElementRef : null}
                    className="home-featured"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="featured-badge">
                      <Flame size={14} />
                      <span>Featured</span>
                    </div>
                    <PostCard food={food} index={0} />
                  </motion.div>
                ) : (
                  // For the rest, we wrap in the grid
                  i === 1 ? (
                    <div key="feed-grid" className="home-grid">
                      {displayedFoods.slice(1).map((gridFood, gridIdx) => {
                        const realIdx = gridIdx + 1;
                        const isLastInGrid = realIdx === displayedFoods.length - 1;
                        const showInnerCaughtUp = gridIdx > 0 && displayedFoods[realIdx-1].isFollowed === 1 && gridFood.isFollowed === 0;
                        
                        return (
                          <div key={gridFood._id} style={{ display: 'contents' }}>
                            {showInnerCaughtUp && (
                              <div style={{ gridColumn: '1 / -1', width: '100%' }}>
                                <EndOfFeed message="You've seen all from your follows!" />
                                <div className="feed-divider">
                                  <span>More for you</span>
                                </div>
                              </div>
                            )}
                            <div 
                              ref={isLastInGrid ? lastFoodElementRef : null}
                              className="home-grid-item"
                            >
                              <PostCard food={gridFood} index={realIdx} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null
                )}
              </>
            );

            // Since i=1 handles all grid items, we only return content for i=0 and i=1
            return i <= 1 ? content : null;
          })}
          
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

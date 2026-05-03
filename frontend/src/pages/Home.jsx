import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getFoodItems } from '../api/food';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import EndOfFeed from '../components/EndOfFeed';
import { interleaveFoodItemsByVendor } from '../utils/feed';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [followingFoods, setFollowingFoods] = useState([]);
  const [discoverFoods, setDiscoverFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedPhase, setFeedPhase] = useState('following');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();
  const arrangedFollowingFoods = useMemo(
    () => interleaveFoodItemsByVendor(followingFoods, { seed: 'home-following', shuffleGroups: false }),
    [followingFoods]
  );
  const arrangedDiscoverFoods = useMemo(
    () => interleaveFoodItemsByVendor(discoverFoods, { seed: 'home-discover', shuffleGroups: true }),
    [discoverFoods]
  );
  const foods = [...arrangedFollowingFoods, ...arrangedDiscoverFoods];

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
    fetchFoods(page, feedPhase);
  }, [page, feedPhase]);

  const fetchFoods = async (pageNum, phase) => {
    const shouldUseInitialLoader = pageNum === 1 && followingFoods.length === 0 && discoverFoods.length === 0;

    if (shouldUseInitialLoader) setLoading(true);
    else setLoadingMore(true);

    try {
      const options = phase === 'following'
        ? { followingOnly: true, sort: 'latest' }
        : { excludeFollowed: true, sort: 'latest' };
      const res = await getFoodItems(pageNum, 8, '', options);
      const newFoods = res.data.foodItems || [];

      if (phase === 'following') {
        setFollowingFoods(prev => pageNum === 1 ? newFoods : [...prev, ...newFoods]);

        if (res.data.hasMore) {
          setHasMore(true);
        } else {
          setFeedPhase('discover');
          setPage(1);
          setHasMore(true);
          if (shouldUseInitialLoader && newFoods.length === 0) {
            setLoading(true);
            setLoadingMore(false);
            return;
          }
        }
      } else {
        setDiscoverFoods(prev => pageNum === 1 ? newFoods : [...prev, ...newFoods]);
        setHasMore(res.data.hasMore);
      }
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
          <p className="home-subtitle">Fresh posts and new finds for you.</p>
        </div>
        <div className="home-user-avatar">
          {(user?.fullName || user?.name || 'U').charAt(0).toUpperCase()}
        </div>
      </motion.header>

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
          <p>Check back soon for delicious content!</p>
        </motion.div>
      ) : (
        <div className="home-feed">
          <div className="home-grid">
            {arrangedFollowingFoods.map((gridFood, gridIdx) => {
              const isLastFollowingCard = arrangedDiscoverFoods.length === 0 && gridIdx === arrangedFollowingFoods.length - 1;

              return (
                <div
                  key={`following-${gridFood._id}`}
                  ref={isLastFollowingCard ? lastFoodElementRef : null}
                  className="home-grid-item"
                >
                  <PostCard food={gridFood} index={gridIdx} />
                </div>
              );
            })}

            {arrangedDiscoverFoods.length > 0 && (
              <div className="home-discovery-break">
                <EndOfFeed
                  message="You've seen the latest posts from people you follow!"
                  subtext="Now here are random posts you might like."
                />
              </div>
            )}

            {arrangedDiscoverFoods.map((gridFood, gridIdx) => {
              const combinedIndex = arrangedFollowingFoods.length + gridIdx;
              const isLastInGrid = combinedIndex === foods.length - 1;

              return (
                <div
                  key={`discover-${gridFood._id}`}
                  ref={isLastInGrid ? lastFoodElementRef : null}
                  className="home-grid-item"
                >
                  <PostCard food={gridFood} index={combinedIndex} />
                </div>
              );
            })}

          </div>

          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <Loader size="small" />
            </div>
          )}
          {!hasMore && foods.length > 0 && feedPhase === 'discover' && (
            <div className="home-feed-end">
              <EndOfFeed />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

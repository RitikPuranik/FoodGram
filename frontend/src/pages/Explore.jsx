import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Heart, X, Hash, TrendingUp,
  ChevronLeft, ChevronRight, MessageCircle,
  Bookmark, Send, CornerDownRight, Trash2,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { getFoodItems, searchFoodByHashtag, likeFood, saveFood, addComment, getComments, deleteComment, replyToComment } from '../api/food';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Avatar from '../components/Avatar';
import EndOfFeed from '../components/EndOfFeed';
import PostLightbox from '../components/PostLightbox';
import './Explore.css';

const TRENDING_TAGS = ['pizza', 'burger', 'sushi', 'biryani', 'tacos', 'pasta', 'dessert', 'bbq', 'vegan', 'streetfood'];

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}



/* ───────────────────────────────────────────
   Main Explore Page
─────────────────────────────────────────── */
export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('tag') || '');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debounceRef = useRef(null);
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
    const initialTag = searchParams.get('tag') || '';
    if (initialTag) { setSearchQuery(initialTag); runSearch(initialTag, 1); }
    else fetchAll(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page > 1) {
      const q = searchQuery.replace(/^#+/, '').trim();
      if (q) runSearch(q, page);
      else fetchAll(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchAll = async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try { 
      const r = await getFoodItems(pageNum, 20); 
      const newFoods = r.data.foodItems || [];
      setFoods(prev => pageNum === 1 ? newFoods : [...prev, ...newFoods]);
      setHasMore(r.data.hasMore);
    } catch {}
    
    setLoading(false);
    setLoadingMore(false);
  };

  const runSearch = async (q, pageNum) => {
    if (pageNum === 1) setSearching(true);
    else setLoadingMore(true);
    
    try { 
      const r = await searchFoodByHashtag(q, pageNum, 20); 
      const newFoods = r.data.foodItems || [];
      setFoods(prev => pageNum === 1 ? newFoods : [...prev, ...newFoods]);
      setHasMore(r.data.hasMore);
    } catch {}
    
    setSearching(false); 
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = searchQuery.replace(/^#+/, '').trim();
    
    if (!searchQuery.trim()) { 
      setSearchParams({}); 
      setPage(1);
      fetchAll(1); 
      return; 
    }
    
    setSearchParams({ tag: q });
    debounceRef.current = setTimeout(() => {
      setPage(1);
      runSearch(q, 1);
    }, 450);
    
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const clearSearch = () => { setSearchQuery(''); setSearchParams({}); };
  const applyTag = (tag) => setSearchQuery(tag);

  const navigate = useCallback((dir) => {
    setSelectedIndex(i => {
      const next = i + dir;
      if (next < 0 || next >= foods.length) return i;
      return next;
    });
  }, [foods.length]);

  const openPost = (idx) => setSelectedIndex(idx);
  const closePost = () => setSelectedIndex(null);

  // Grid: repeating pattern of [3 normal] → [wide + 1 normal] → [3 normal] → [1 normal + wide]
  // This matches Instagram-style explore where every 5th item in a group is wide (2-col span)
  const buildGridItems = (items) => {
    const out = [];
    let idx = 0;
    let cycle = 0; // alternates wide-left vs wide-right

    while (idx < items.length) {
      // Block A: 3 square tiles
      for (let i = 0; i < 3 && idx < items.length; i++, idx++) {
        out.push({ food: items[idx], span: 1, origIdx: idx });
      }
      if (idx >= items.length) break;

      // Block B: 1 wide tile (span 2) + 1 normal tile
      if (cycle % 2 === 0) {
        // wide on left
        out.push({ food: items[idx], span: 2, origIdx: idx }); idx++;
        if (idx < items.length) { out.push({ food: items[idx], span: 1, origIdx: idx }); idx++; }
      } else {
        // wide on right
        out.push({ food: items[idx], span: 1, origIdx: idx }); idx++;
        if (idx < items.length) { out.push({ food: items[idx], span: 2, origIdx: idx }); idx++; }
      }
      cycle++;
    }
    return out;
  };

  const gridItems = buildGridItems(foods);
  const isSearching = !!searchQuery.trim();

  return (
    <div className="explore-page">

      {/* Search Bar */}
      <motion.div className="explore-search-bar" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Hash size={18} className="explore-search-icon" />
        <input
          type="text"
          placeholder="Search by hashtag — e.g. pizza, burger..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value.replace(/\s+/g, ''))}
          className="explore-search-input"
        />
        {searching && <span className="explore-search-spinner" />}
        {searchQuery && (
          <button className="explore-search-clear" onClick={clearSearch}><X size={16} /></button>
        )}
      </motion.div>

      {/* Trending */}
      <AnimatePresence>
        {!isSearching && (
          <motion.div className="explore-trending"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            <div className="explore-trending-label"><TrendingUp size={14} /><span>Trending</span></div>
            <div className="explore-trending-tags">
              {TRENDING_TAGS.map(tag => (
                <button key={tag} className="explore-tag-pill" onClick={() => applyTag(tag)}>#{tag}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results header */}
      {isSearching && !loading && (
        <motion.div className="explore-results-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span>
            {foods.length > 0 ? `${foods.length} result${foods.length !== 1 ? 's' : ''} for ` : 'No results for '}
            <strong>#{searchQuery.replace(/^#+/, '')}</strong>
          </span>
          <button className="explore-clear-link" onClick={clearSearch}>Clear</button>
        </motion.div>
      )}

      {/* Grid */}
      {loading ? (
        <Loader text="Discovering food..." />
      ) : foods.length === 0 ? (
        <motion.div className="explore-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="explore-empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try a different tag like #pizza or #burger</p>
          <div className="explore-empty-suggestions">
            {TRENDING_TAGS.slice(0, 5).map(tag => (
              <button key={tag} className="explore-tag-pill" onClick={() => applyTag(tag)}>#{tag}</button>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="explore-grid">
          {gridItems.map((item, i) => {
            const isLast = i === gridItems.length - 1;
            return (
              <motion.div
                key={item.food._id + '-' + i}
                ref={isLast ? lastFoodElementRef : null}
                className={`explore-tile ${item.span === 2 ? 'explore-tile-wide' : ''}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                onClick={() => openPost(item.origIdx)}
              >
                {item.food.video?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                  <img src={item.food.video} className="explore-tile-video" alt="Food" style={{objectFit: 'cover'}} />
                ) : (
                  <video
                    muted loop playsInline preload="metadata"
                    className="explore-tile-video"
                    onMouseEnter={e => e.target.play()}
                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                  >
                    <source src={`${item.food.video}?tr=orig-true#t=1.0`} type="video/mp4" />
                  </video>
                )}
                <div className="explore-tile-overlay">
                  <div className="explore-tile-play"><Play size={20} fill="white" /></div>
                  <div className="explore-tile-stats"><Heart size={14} fill="white" /><span>{item.food.likeCount || 0}</span></div>
                  {item.food.hashtags?.length > 0 && (
                    <div className="explore-tile-tags">
                      {item.food.hashtags.slice(0, 3).map(tag => (
                        <span key={tag} className="explore-tile-tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {loadingMore && (
            <div className="explore-loader-more" style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>
              <Loader size="small" />
            </div>
          )}
        </div>
      )}

      {!hasMore && foods.length > 0 && (
        <EndOfFeed message={searchQuery ? "That's all the matches!" : "You've seen everything!"} />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <PostLightbox
            foods={foods}
            selectedIndex={selectedIndex}
            onClose={closePost}
            onNavigate={navigate}
            onTagClick={applyTag}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

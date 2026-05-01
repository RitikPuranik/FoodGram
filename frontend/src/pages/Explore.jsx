import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
   Inline Comment Panel (used inside the modal)
─────────────────────────────────────────── */
function InlineComments({ foodId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (!foodId) return;
    setLoading(true);
    getComments(foodId)
      .then(r => setComments(r.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [foodId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment(foodId, newComment.trim());
      setNewComment('');
      const r = await getComments(foodId);
      setComments(r.data.comments || []);
    } catch {}
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      await replyToComment(parentId, replyText.trim());
      setReplyText(''); setReplyingTo(null);
      const r = await getComments(foodId);
      setComments(r.data.comments || []);
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      const r = await getComments(foodId);
      setComments(r.data.comments || []);
    } catch {}
  };

  const renderComment = (comment, depth = 0) => (
    <div key={comment._id} className={`ic-comment ${depth > 0 ? 'ic-reply' : ''}`}>
      <div className="ic-avatar">
        <Avatar src={comment.user?.avatar || null} name={comment.user?.fullName} size={32} />
      </div>
      <div className="ic-body">
        <div className="ic-header">
          <span className="ic-author">{comment.user?.fullName || 'User'}</span>
          <span className="ic-time">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="ic-text">{comment.comment}</p>
        <div className="ic-actions">
          <button className="ic-action-btn" onClick={() => setReplyingTo(comment._id)}>
            <CornerDownRight size={12} /> Reply
          </button>
          {user && comment.user?._id === user._id && (
            <button className="ic-action-btn ic-delete" onClick={() => handleDelete(comment._id)}>
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
        {replyingTo === comment._id && (
          <div className="ic-reply-input">
            <input
              autoFocus
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReply(comment._id)}
            />
            <button onClick={() => handleReply(comment._id)} className="ic-send"><Send size={13} /></button>
            <button onClick={() => setReplyingTo(null)} className="ic-cancel"><X size={13} /></button>
          </div>
        )}
        {comment.replies?.length > 0 && (
          <div className="ic-nested">
            <button className="ic-toggle" onClick={() => setExpandedReplies(p => ({ ...p, [comment._id]: !p[comment._id] }))}>
              {expandedReplies[comment._id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expandedReplies[comment._id] ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            {expandedReplies[comment._id] && comment.replies.map(r => renderComment(r, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="ic-root">
      <div className="ic-list">
        {loading ? (
          <div className="ic-empty">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="ic-empty">
            <MessageCircle size={28} opacity={0.4} />
            <p>No comments yet.</p>
            <span>Be the first to comment! 💬</span>
          </div>
        ) : (
          comments.map(c => renderComment(c))
        )}
      </div>
      <form className="ic-input-bar" onSubmit={handleAdd}>
        <div className="ic-input-avatar">
          <Avatar src={user?.avatar || null} name={user?.fullName} size={30} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <button type="submit" className={`ic-send-btn ${newComment.trim() ? 'active' : ''}`} disabled={!newComment.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

/* ───────────────────────────────────────────
   Instagram-style Post Lightbox
─────────────────────────────────────────── */
function PostLightbox({ foods, selectedIndex, onClose, onNavigate, onTagClick }) {
  const { user } = useAuth();
  const food = foods[selectedIndex];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(food?.likeCount || 0);

  // Reset state when food changes
  useEffect(() => {
    setLiked(false);
    setSaved(false);
    setLikeCount(food?.likeCount || 0);
  }, [food?._id]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNavigate, onClose]);

  const handleLike = async () => {
    try {
      setLiked(p => !p);
      setLikeCount(p => liked ? p - 1 : p + 1);
      await likeFood(food._id);
    } catch {}
  };

  const handleSave = async () => {
    try { setSaved(p => !p); await saveFood(food._id); } catch {}
  };

  if (!food) return null;
  const authorInitial = food.name?.charAt(0)?.toUpperCase() || 'F';

  return (
    <motion.div
      className="lb-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Left Arrow */}
      {selectedIndex > 0 && (
        <button
          className="lb-nav lb-nav-left"
          onClick={e => { e.stopPropagation(); onNavigate(-1); }}
          aria-label="Previous post"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Modal Box */}
      <motion.div
        className="lb-modal"
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT — Video */}
        <div className="lb-video-side">
          <video
            key={food.video}
            src={food.video}
            autoPlay
            loop
            playsInline
            controls
            className="lb-video"
          />
        </div>

        {/* RIGHT — Info Panel */}
        <div className="lb-info-side">

          {/* Header */}
          <div className="lb-header">
            <div className="lb-author">
              <Avatar
                src={food?.foodPartner?.avatar || null}
                name={food?.name || 'F'}
                size={40}
                className="lb-author-avatar-override"
              />
              <div className="lb-author-meta">
                <span className="lb-author-name">{food.name}</span>
                {food.createdAt && (
                  <span className="lb-author-time">{timeAgo(food.createdAt)}</span>
                )}
              </div>
            </div>
            <button className="lb-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Description + Hashtags */}
          <div className="lb-description">
            {food.description && <p>{food.description}</p>}
            {food.hashtags?.length > 0 && (
              <div className="lb-tags">
                {food.hashtags.map(tag => (
                  <button
                    key={tag}
                    className="explore-tag-pill small"
                    onClick={() => { onClose(); onTagClick(tag); }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comments (scrollable) */}
          <InlineComments foodId={food._id} />

          {/* Action Bar */}
          <div className="lb-actions">
            <div className="lb-actions-left">
              <button
                className={`lb-action-btn ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label="Like"
              >
                <Heart size={24} fill={liked ? 'var(--accent-red)' : 'none'} />
              </button>
              <button className="lb-action-btn" aria-label="Comment">
                <MessageCircle size={24} />
              </button>
            </div>
            <button
              className={`lb-action-btn ${saved ? 'saved' : ''}`}
              onClick={handleSave}
              aria-label="Save"
            >
              <Bookmark size={24} fill={saved ? 'var(--primary)' : 'none'} />
            </button>
          </div>

          {/* Like count */}
          <div className="lb-like-count">
            <strong>{likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}</strong>
          </div>
        </div>
      </motion.div>

      {/* Right Arrow */}
      {selectedIndex < foods.length - 1 && (
        <button
          className="lb-nav lb-nav-right"
          onClick={e => { e.stopPropagation(); onNavigate(1); }}
          aria-label="Next post"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </motion.div>
  );
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

  const debounceRef = useRef(null);

  useEffect(() => {
    const initialTag = searchParams.get('tag') || '';
    if (initialTag) { setSearchQuery(initialTag); runSearch(initialTag); }
    else fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await getFoodItems(); setFoods(r.data.foodItems || []); } catch {}
    setLoading(false);
  };

  const runSearch = async (q) => {
    setSearching(true);
    try { const r = await searchFoodByHashtag(q); setFoods(r.data.foodItems || []); } catch {}
    setSearching(false); setLoading(false);
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearchParams({}); fetchAll(); return; }
    const q = searchQuery.replace(/^#+/, '').trim();
    setSearchParams({ tag: q });
    debounceRef.current = setTimeout(() => runSearch(q), 450);
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
          {gridItems.map((item, i) => (
            <motion.div
              key={item.food._id + '-' + i}
              className={`explore-tile ${item.span === 2 ? 'explore-tile-wide' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={() => openPost(item.origIdx)}
            >
              <video
                src={item.food.video}
                muted loop playsInline preload="metadata"
                className="explore-tile-video"
                onMouseEnter={e => e.target.play()}
                onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
              />
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
          ))}
        </div>
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

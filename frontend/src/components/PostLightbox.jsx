import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, X, ChevronLeft, ChevronRight, MessageCircle, Bookmark, Send, CornerDownRight, Trash2, ChevronDown, ChevronUp, MoreVertical, Edit2
} from 'lucide-react';
import { likeFood, saveFood, addComment, getComments, deleteComment, replyToComment, deleteFood, updateFood } from '../api/food';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './PostLightbox.css';

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

export default function PostLightbox({ foods, selectedIndex, onClose, onNavigate, onTagClick, onFoodDeleted, onFoodUpdated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const food = foods[selectedIndex];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(food?.likeCount || 0);

  // Edit/Delete state
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');

  const isOwner = user && (
    (food?.foodPartner?._id && food.foodPartner._id.toString() === user._id.toString()) ||
    (food?.foodPartner && food.foodPartner.toString() === user._id.toString())
  );

  // Reset state when food changes
  useEffect(() => {
    setLiked(false);
    setSaved(false);
    setLikeCount(food?.likeCount || 0);
    setShowMenu(false);
    setIsEditing(false);
    setEditName(food?.name || '');
    setEditDesc(food?.description || '');
    setEditTags(food?.hashtags?.join(', ') || '');
  }, [food?._id]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      // Don't navigate if typing in input
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
      if (e.key === 'ArrowRight' && onNavigate) onNavigate(1);
      if (e.key === 'ArrowLeft' && onNavigate) onNavigate(-1);
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteFood(food._id);
      if (onFoodDeleted) onFoodDeleted(food._id);
      else onClose(); // If no callback, just close the modal
    } catch (e) {
      console.error(e);
      alert('Failed to delete post.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const data = {
        name: editName,
        description: editDesc,
        hashtags: editTags
      };
      const res = await updateFood(food._id, data);
      setIsEditing(false);
      setShowMenu(false);
      if (onFoodUpdated) onFoodUpdated(res.data.food);
      else {
          // If no callback, we can just reload the page or update locally if possible,
          // but the parent handles it best.
          window.location.reload(); 
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update post.');
    }
  };

  if (!food) return null;

  return (
    <motion.div
      className="lb-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Left Arrow */}
      {selectedIndex > 0 && onNavigate && (
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
          {food?.mediaType === 'image' || food?.video?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
            <img src={food.video} className="lb-video" alt="Food" style={{objectFit: 'cover'}} />
          ) : (
            <video
              key={food.video}
              autoPlay
              loop
              playsInline
              controls
              className="lb-video"
            >
              <source src={`${food.video}?tr=orig-true#t=1.0`} type="video/mp4" />
            </video>
          )}
        </div>

        {/* RIGHT — Info Panel */}
        <div className="lb-info-side">

          {/* Header */}
          <div className="lb-header">
            <div
              className="lb-author"
              onClick={() => {
                if (food?.foodPartner?._id) {
                  onClose();
                  navigate(`/vendor/${food.foodPartner._id}`);
                }
              }}
              style={{ cursor: food?.foodPartner?._id ? 'pointer' : 'default' }}
            >
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
            
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              {isOwner && (
                <div style={{ position: 'relative' }}>
                  <button className="lb-close" onClick={() => setShowMenu(!showMenu)} aria-label="Menu">
                    <MoreVertical size={20} />
                  </button>
                  {showMenu && (
                    <div className="lb-dropdown-menu">
                      <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                        <Edit2 size={14} /> Edit Post
                      </button>
                      <button onClick={handleDelete} className="lb-dropdown-delete">
                        <Trash2 size={14} /> Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button className="lb-close" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Description + Hashtags / Editing Form */}
          <div className="lb-description">
            {isEditing ? (
              <div className="lb-edit-form">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  placeholder="Post Title" 
                  className="lb-edit-input" 
                />
                <textarea 
                  value={editDesc} 
                  onChange={e => setEditDesc(e.target.value)} 
                  placeholder="Description..." 
                  className="lb-edit-textarea"
                />
                <input 
                  type="text" 
                  value={editTags} 
                  onChange={e => setEditTags(e.target.value)} 
                  placeholder="Hashtags (comma separated)" 
                  className="lb-edit-input" 
                />
                <div className="lb-edit-actions">
                  <button onClick={() => setIsEditing(false)} className="lb-edit-cancel">Cancel</button>
                  <button onClick={handleSaveEdit} className="lb-edit-save">Save Changes</button>
                </div>
              </div>
            ) : (
              <>
                {food.description && <p>{food.description}</p>}
                {food.hashtags?.length > 0 && (
                  <div className="lb-tags">
                    {food.hashtags.map(tag => (
                      <button
                        key={tag}
                        className="explore-tag-pill small"
                        onClick={() => { if(onTagClick) { onClose(); onTagClick(tag); } }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </>
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
                <Heart size={24} fill={liked ? 'var(--accent-red)' : 'none'} color={liked ? 'var(--accent-red)' : 'currentColor'} />
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
              <Bookmark size={24} fill={saved ? 'var(--primary)' : 'none'} color={saved ? 'var(--primary)' : 'currentColor'} />
            </button>
          </div>

          {/* Like count */}
          <div className="lb-like-count">
            <strong>{likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}</strong>
          </div>
        </div>
      </motion.div>

      {/* Right Arrow */}
      {selectedIndex < foods.length - 1 && onNavigate && (
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

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getComments, addComment, deleteComment, replyToComment } from '../api/food';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './CommentSheet.css';

export default function CommentSheet({ foodId, isOpen, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const inputRef = useRef(null);
  const replyInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && foodId) {
      fetchComments();
    }
  }, [isOpen, foodId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await getComments(foodId);
      setComments(res.data.comments || []);
    } catch (err) {
      setComments([]);
    }
    setLoading(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment(foodId, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      await replyToComment(parentId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  const renderComment = (comment, depth = 0) => (
    <motion.div
      key={comment._id}
      className={`comment-item ${depth > 0 ? 'comment-reply' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="comment-avatar">
        <Avatar src={comment.user?.avatar || null} name={comment.user?.fullName} size={36} />
      </div>
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.user?.fullName || 'User'}</span>
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="comment-text">{comment.comment}</p>
        <div className="comment-actions">
          <button
            className="comment-action-btn"
            onClick={() => {
              setReplyingTo(comment._id);
              setTimeout(() => replyInputRef.current?.focus(), 100);
            }}
          >
            <CornerDownRight size={13} /> Reply
          </button>
          {user && comment.user?._id === user._id && (
            <button
              className="comment-action-btn comment-delete"
              onClick={() => handleDelete(comment._id)}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>

        {/* Reply input */}
        <AnimatePresence>
          {replyingTo === comment._id && (
            <motion.div
              className="reply-input-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                ref={replyInputRef}
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply(comment._id)}
              />
              <button onClick={() => handleReply(comment._id)} className="reply-send-btn">
                <Send size={14} />
              </button>
              <button onClick={() => setReplyingTo(null)} className="reply-cancel-btn">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies-section">
            <button
              className="toggle-replies-btn"
              onClick={() => toggleReplies(comment._id)}
            >
              {expandedReplies[comment._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expandedReplies[comment._id] ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            <AnimatePresence>
              {expandedReplies[comment._id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {comment.replies.map((r) => renderComment(r, depth + 1))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="comment-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="comment-sheet glass"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="comment-sheet-header">
              <div className="comment-sheet-handle" />
              <h3>Comments</h3>
              <button className="comment-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="comment-list">
              {loading ? (
                <div className="comment-loading">
                  <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: '80%', height: 60 }} />
                </div>
              ) : comments.length === 0 ? (
                <div className="comment-empty">
                  <p>No comments yet</p>
                  <span>Be the first to comment! 💬</span>
                </div>
              ) : (
                comments.map((c) => renderComment(c))
              )}
            </div>

            <form className="comment-input-bar" onSubmit={handleAddComment}>
              <div className="comment-input-avatar">
                <Avatar src={user?.avatar || null} name={user?.fullName} size={34} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                className={`comment-send-btn ${newComment.trim() ? 'active' : ''}`}
                disabled={!newComment.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

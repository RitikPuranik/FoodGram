import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Send, Trash2, CornerDownRight } from 'lucide-react';
import { getComments, addComment, deleteComment, replyToComment } from '../api/food';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './CommentSheet.css';

export default function CommentSheet({ foodId, isOpen, onClose }) {
  const { user } = useAuth();
  const MOBILE_NORMAL_HEIGHT_RATIO = 0.72;
  const MOBILE_CLOSE_HEIGHT_RATIO = 0.42;
  const MOBILE_MIN_HEIGHT_RATIO = 0.32;
  const MOBILE_FULL_HEIGHT_RATIO = 0.9;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [sheetSize, setSheetSize] = useState('normal');
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileSheetHeight, setMobileSheetHeight] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef(null);
  const replyInputRef = useRef(null);
  const resizeStateRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen && foodId) {
      setSheetSize('normal');
      fetchComments();
    }
  }, [isOpen, foodId]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 769px)');
    const syncViewportMode = (event) => {
      setIsDesktop(event.matches ?? mediaQuery.matches);
    };

    syncViewportMode(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncViewportMode);
      return () => mediaQuery.removeEventListener('change', syncViewportMode);
    }

    mediaQuery.addListener(syncViewportMode);
    return () => mediaQuery.removeListener(syncViewportMode);
  }, []);

  const getViewportHeight = useCallback(() => (
    typeof window === 'undefined' ? 0 : window.innerHeight
  ), []);

  const getNormalMobileHeight = useCallback(() => (
    Math.round(getViewportHeight() * MOBILE_NORMAL_HEIGHT_RATIO)
  ), [getViewportHeight]);

  useEffect(() => {
    if (!isOpen || isDesktop) return;

    const viewportHeight = getViewportHeight();
    const nextHeight = sheetSize === 'full' ? viewportHeight : getNormalMobileHeight();
    setMobileSheetHeight(nextHeight);
  }, [isOpen, isDesktop, sheetSize, getNormalMobileHeight, getViewportHeight]);

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

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleMobileResizeMove = useCallback((event) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;

    const deltaY = event.clientY - resizeState.startY;
    const nextHeight = Math.min(
      resizeState.maxHeight,
      Math.max(resizeState.minHeight, resizeState.startHeight - deltaY)
    );

    resizeState.lastHeight = nextHeight;
    setMobileSheetHeight(nextHeight);
  }, []);

  const handleMobileResizeEnd = useCallback(() => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;

    window.removeEventListener('pointermove', handleMobileResizeMove);
    window.removeEventListener('pointerup', handleMobileResizeEnd);
    window.removeEventListener('pointercancel', handleMobileResizeEnd);
    setIsResizing(false);

    const currentHeight = resizeState.lastHeight;

    if (currentHeight >= resizeState.maxHeight * MOBILE_FULL_HEIGHT_RATIO) {
      setSheetSize('full');
      setMobileSheetHeight(resizeState.maxHeight);
    } else if (currentHeight <= resizeState.maxHeight * MOBILE_CLOSE_HEIGHT_RATIO) {
      closeSheet();
    } else {
      setSheetSize('normal');
      setMobileSheetHeight(resizeState.normalHeight);
    }

    resizeStateRef.current = null;
  }, [closeSheet, handleMobileResizeMove, MOBILE_CLOSE_HEIGHT_RATIO, MOBILE_FULL_HEIGHT_RATIO]);

  useEffect(() => () => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointermove', handleMobileResizeMove);
    window.removeEventListener('pointerup', handleMobileResizeEnd);
    window.removeEventListener('pointercancel', handleMobileResizeEnd);
  }, [handleMobileResizeEnd, handleMobileResizeMove]);

  const startHandleDrag = (event) => {
    if (!isDesktop) {
      event.preventDefault();

      const viewportHeight = getViewportHeight();
      const normalHeight = getNormalMobileHeight();
      const startHeight = mobileSheetHeight ?? (sheetSize === 'full' ? viewportHeight : normalHeight);

      resizeStateRef.current = {
        startY: event.clientY,
        startHeight,
        lastHeight: startHeight,
        minHeight: Math.round(viewportHeight * MOBILE_MIN_HEIGHT_RATIO),
        maxHeight: viewportHeight,
        normalHeight,
      };

      setIsResizing(true);
      window.addEventListener('pointermove', handleMobileResizeMove);
      window.addEventListener('pointerup', handleMobileResizeEnd);
      window.addEventListener('pointercancel', handleMobileResizeEnd);
      return;
    }

    dragControls.start(event);
  };

  const handleDragEnd = (_, info) => {
    const distance = isDesktop ? info.offset.x : info.offset.y;

    if (isDesktop) {
      if (sheetSize === 'full') {
        if (distance > 260) {
          closeSheet();
          return;
        }

        if (distance > 110) {
          setSheetSize('normal');
          return;
        }

        setSheetSize('full');
        return;
      }

      if (distance < -90) {
        setSheetSize('full');
        return;
      }

      if (distance > 120) {
        closeSheet();
        return;
      }

      setSheetSize('normal');
      return;
    }

    if (sheetSize === 'full') {
      if (distance > 220) {
        closeSheet();
        return;
      }

      if (distance > 90) {
        setSheetSize('normal');
        return;
      }

      setSheetSize('full');
      return;
    }

    if (distance < -80) {
      setSheetSize('full');
      return;
    }

    if (distance > 170) {
      closeSheet();
      return;
    }

    setSheetSize('normal');
  };

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
        <Avatar src={comment.user?.avatar || null} name={comment.user?.fullName} size={32} />
      </div>
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.user?.username || comment.user?.fullName || 'User'}</span>
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="comment-text">
          {depth > 0 && comment.replyToUsername && (
            <span className="comment-mention">@{comment.replyToUsername} </span>
          )}
          {comment.comment}
        </p>
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
                placeholder={`Replying to @${comment.user?.username || comment.user?.fullName || 'user'}...`}
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
              <span className="toggle-line"></span>
              {expandedReplies[comment._id] ? 'Hide replies' : `View replies (${comment.replies.length})`}
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

  const content = (
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
            className={`comment-sheet comment-sheet--${sheetSize} ${isResizing ? 'comment-sheet--resizing' : ''} glass`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={!isDesktop && mobileSheetHeight ? { height: mobileSheetHeight, maxHeight: mobileSheetHeight } : undefined}
            drag={isDesktop ? 'x' : false}
            dragControls={dragControls}
            dragConstraints={isDesktop ? { left: -320, right: 320 } : undefined}
            dragElastic={0.12}
            dragListener={false}
            dragMomentum={false}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
          >
            <div className="comment-sheet-header">
              <button
                type="button"
                className="comment-sheet-dragger"
                onPointerDown={startHandleDrag}
                aria-label="Resize comments"
              >
                <span className="comment-sheet-handle" />
              </button>
              <div className="comment-sheet-title">
                <h3>Comments</h3>
                <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              </div>
              <div className="comment-sheet-header-actions">
                <button className="comment-close-btn" onClick={closeSheet} type="button" aria-label="Close comments">
                  <X size={18} />
                </button>
              </div>
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
                <Avatar src={user?.avatar || null} name={user?.fullName} size={30} />
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

  return createPortal(content, document.body);
}

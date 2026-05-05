import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import CommentSheet from './CommentSheet';
import Avatar from './Avatar';
import { likeFood, saveFood } from '../api/food';
import './PostCard.css';

export default function PostCard({ food, index = 0 }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(food?.likeCount || 0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const lastTap = useRef(0);

  // Resolve vendor ID whether foodPartner is a populated object or a raw string ID
  const vendorId = food?.foodPartner?._id || (typeof food?.foodPartner === 'string' ? food.foodPartner : null);

  // Intersection observer for autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => { });
          setPlaying(true);
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      await likeFood(food._id);
    } catch (err) {
      setLiked(liked);
      setLikeCount(food?.likeCount || 0);
    }
  };

  const handleSave = async () => {
    try {
      setSaved(!saved);
      await saveFood(food._id);
    } catch (err) {
      setSaved(saved);
    }
  };

  const handleVendorClick = (e) => {
    e.stopPropagation();
    if (vendorId) navigate(`/vendor/${vendorId}`);
  };

  return (
    <>
      <motion.article
        className="post-card"
        ref={cardRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
      >
        {/* Video Container */}
        <div className="post-video-container" onClick={handleDoubleTap}>
          {food?.mediaType === 'image' || food?.video?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
            <img src={food?.video?.includes('imagekit.io') && !food?.video?.includes('tr=') ? `${food.video}?tr=orig-true` : food?.video} className="post-video" alt="Food post" style={{ objectFit: 'cover' }} />
          ) : (
            <video
              ref={videoRef}
              loop
              muted={muted}
              playsInline
              preload="metadata"
              className="post-video"
            >
              <source src={food?.video ? `${food.video}?tr=orig-true#t=1.0` : ''} type="video/mp4" />
            </video>
          )}

          {/* Play/Pause overlay */}
          {!playing && food?.mediaType !== 'image' && !food?.video?.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
            <div className="post-play-overlay" onClick={togglePlay}>
              <Play size={48} fill="white" />
            </div>
          )}

          {/* Double tap heart animation */}
          {showHeart && (
            <motion.div
              className="post-heart-burst"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Heart size={80} fill="var(--primary)" color="var(--primary)" />
            </motion.div>
          )}

          {/* Mute toggle */}
          {food?.mediaType !== 'image' && !food?.video?.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
            <button
              className="post-mute-btn"
              onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}
        </div>

        {/* Post Info - Restructured to look like Reels inside the container */}
        <div className="post-info overlay-style">
          <div className="post-info-left">
            <div
              className={`post-vendor-link ${isExpanded ? 'expanded' : ''}`}
            >
              <div className="post-meta-header" onClick={handleVendorClick} style={{ cursor: vendorId ? 'pointer' : 'default' }}>
                <Avatar
                  src={food?.foodPartner?.avatar || null}
                  name={food?.name || 'F'}
                  size={40}
                  className="post-avatar"
                />
                <h3 className="post-title">{food?.name || 'Delicious Food'}</h3>
              </div>

              <div className="post-meta-content" onClick={toggleExpand}>
                {food?.description && (
                  <p className={`post-desc ${isExpanded ? 'expanded' : 'truncated'}`}>
                    {food.description}
                    {!isExpanded && <span className="more-text"> ...more</span>}
                  </p>
                )}
                {/* Hashtag chips */}
                {food?.hashtags?.length > 0 && (
                  <div className={`post-hashtags ${isExpanded ? 'expanded' : 'truncated'}`}>
                    {food.hashtags.map((tag) => (
                      <button
                        key={tag}
                        className="post-hashtag-chip"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/explore?tag=${encodeURIComponent(tag)}`);
                        }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="post-actions overlay-actions">
            <button
              className={`post-action-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <Heart
                size={28}
                fill={liked ? 'var(--accent-red)' : 'none'}
                color={liked ? 'var(--accent-red)' : 'currentColor'}
              />
              <span className="action-count">{likeCount > 0 ? likeCount : ''}</span>
            </button>
            <button
              className="post-action-btn"
              onClick={() => setShowComments(true)}
            >
              <MessageCircle size={28} />
              <span className="action-count">{food?.commentCount > 0 ? food.commentCount : ''}</span>
            </button>
            <button
              className={`post-action-btn ${saved ? 'saved' : ''}`}
              onClick={handleSave}
            >
              <Bookmark
                size={28}
                fill={saved ? 'var(--primary)' : 'none'}
                color={saved ? 'var(--primary)' : 'currentColor'}
              />
              <span className="action-count">{food?.savesCount > 0 ? food.savesCount : ''}</span>
            </button>
          </div>
        </div>
      </motion.article>

      <CommentSheet
        foodId={food?._id}
        food={food}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </>
  );
}
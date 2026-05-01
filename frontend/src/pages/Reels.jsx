import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, Volume2, VolumeX, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFoodItems, likeFood, saveFood } from '../api/food';
import CommentSheet from '../components/CommentSheet';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';
import './Reels.css';

export default function Reels() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const res = await getFoodItems();
      setFoods(res.data.foodItems || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div className="reels-page"><Loader text="Loading reels..." /></div>;
  if (foods.length === 0) {
    return (
      <div className="reels-page reels-empty">
        <div className="reels-empty-icon">🎬</div>
        <h3>No reels yet</h3>
        <p>Come back soon for tasty content!</p>
      </div>
    );
  }

  return (
    <div className="reels-page" ref={containerRef}>
      <div className="reels-scroll-container">
        {foods.map((food) => (
          <ReelItem key={food._id} food={food} />
        ))}
      </div>
    </div>
  );
}

function ReelItem({ food }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const itemRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(food?.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  // IntersectionObserver for autoplay when in view
  useEffect(() => {
    const video = videoRef.current;
    const item = itemRef.current;
    if (!video || !item) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
          video.currentTime = 0;
          video.play().catch(() => {});
          setPlaying(true);
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.7 }
    );
    observer.observe(item);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      togglePlay();
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

  return (
    <div className="reel-item" ref={itemRef}>
      <div className="reel-video-wrap" onClick={handleDoubleTap}>
        <video
          ref={videoRef}
          src={food?.video}
          loop
          muted={muted}
          playsInline
          preload="metadata"
          className="reel-video"
        />

        {/* Pause icon */}
        {!playing && (
          <div className="reel-pause-overlay">
            <Play size={56} fill="white" strokeWidth={0} />
          </div>
        )}

        {/* Double tap heart */}
        {showHeart && (
          <div className="reel-heart-burst">
            <Heart size={100} fill="var(--primary)" color="var(--primary)" />
          </div>
        )}

        {/* Bottom gradient */}
        <div className="reel-gradient" />

        {/* Bottom info */}
        <div className="reel-info">
          <div
            className="reel-vendor-link"
            onClick={(e) => {
              e.stopPropagation();
              if (food?.foodPartner?._id) navigate(`/vendor/${food.foodPartner._id}`);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: food?.foodPartner?._id ? 'pointer' : 'default' }}
          >
            <Avatar
              src={food?.foodPartner?.avatar || null}
              name={food?.foodPartner?.name || food?.name || 'F'}
              size={40}
              className="reel-info-avatar-img"
            />
            <div className="reel-info-text">
              <h3>{food?.name || 'Delicious Food'}</h3>
              {food?.description && <p>{food.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Side actions */}
      <div className="reel-actions">
        <button
          className={`reel-action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <Heart
            size={26}
            fill={liked ? 'var(--accent-red)' : 'none'}
            color={liked ? 'var(--accent-red)' : 'white'}
            strokeWidth={2}
          />
          <span>{likeCount > 0 ? likeCount : ''}</span>
        </button>
        <button className="reel-action-btn" onClick={() => setShowComments(true)}>
          <MessageCircle size={26} />
          <span>Chat</span>
        </button>
        <button
          className={`reel-action-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
        >
          <Bookmark
            size={26}
            fill={saved ? 'var(--primary)' : 'none'}
            color={saved ? 'var(--primary)' : 'white'}
          />
          <span>Save</span>
        </button>
        <button
          className="reel-action-btn"
          onClick={() => setMuted(!muted)}
        >
          {muted ? <VolumeX size={26} /> : <Volume2 size={26} />}
        </button>
      </div>

      <CommentSheet
        foodId={food?._id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Play, MapPin, Phone } from 'lucide-react';
import { getFoodPartnerById } from '../api/foodPartner';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';
import './VendorProfile.css';

export default function VendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const res = await getFoodPartnerById(id);
      const data = res.data;
      setVendor(data.foodPartner);
      setFoodItems(data.foodPartner.foodItems || []);
    } catch (e) {
      setError('Vendor not found');
    }
    setLoading(false);
  };

  if (loading) return <div className="vendor-page"><Loader text="Loading profile..." /></div>;
  if (error) return (
    <div className="vendor-page vendor-error">
      <div className="vendor-error-icon">🍽️</div>
      <h3>{error}</h3>
      <button className="btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const totalLikes = foodItems.reduce((sum, f) => sum + (f.likeCount || 0), 0);

  return (
    <div className="vendor-page">
      {/* Back button */}
      <button className="vendor-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Hero / Header */}
      <motion.div
        className="vendor-header glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Avatar
          src={vendor?.avatar}
          name={vendor?.name}
          size={90}
          className="vendor-avatar"
        />
        <div className="vendor-header-info">
          <h1 className="vendor-name">{vendor?.name}</h1>
          <p className="vendor-role">🍳 Food Vendor</p>
          {vendor?.bio && <p className="vendor-bio">{vendor.bio}</p>}

          <div className="vendor-meta">
            {vendor?.address && (
              <span className="vendor-meta-item">
                <MapPin size={13} /> {vendor.address}
              </span>
            )}
            {vendor?.phone && (
              <span className="vendor-meta-item">
                <Phone size={13} /> {vendor.phone}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="vendor-stats">
          <div className="vendor-stat">
            <span className="vendor-stat-num">{foodItems.length}</span>
            <span className="vendor-stat-label">Posts</span>
          </div>
          <div className="vendor-stat">
            <span className="vendor-stat-num">{totalLikes}</span>
            <span className="vendor-stat-label">Likes</span>
          </div>
        </div>
      </motion.div>

      {/* Posts Grid */}
      {foodItems.length === 0 ? (
        <div className="vendor-empty">
          <Play size={36} opacity={0.4} />
          <p>No posts yet</p>
        </div>
      ) : (
        <motion.div
          className="vendor-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {foodItems.map((food, i) => (
            <motion.div
              key={food._id}
              className="vendor-grid-item"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedFood(food)}
            >
              <video
                src={food.video}
                muted
                preload="metadata"
                className="vendor-grid-video"
                onMouseEnter={e => e.target.play()}
                onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
              />
              <div className="vendor-grid-overlay">
                <div className="vendor-grid-stat">
                  <Heart size={13} fill="white" /> {food.likeCount || 0}
                </div>
                <Play size={15} fill="white" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Preview modal */}
      {selectedFood && (
        <motion.div
          className="vendor-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedFood(null)}
        >
          <motion.div
            className="vendor-modal glass"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <video
              src={selectedFood.video}
              autoPlay
              loop
              playsInline
              controls
              className="vendor-modal-video"
            />
            <div className="vendor-modal-info">
              <h3>{selectedFood.name}</h3>
              {selectedFood.description && <p>{selectedFood.description}</p>}
              {selectedFood.hashtags?.length > 0 && (
                <div className="vendor-modal-tags">
                  {selectedFood.hashtags.map(tag => (
                    <span key={tag} className="vendor-modal-tag">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="vendor-modal-likes">
                <Heart size={16} fill="var(--accent-red)" color="var(--accent-red)" />
                {selectedFood.likeCount || 0} likes
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Grid3X3, Bookmark, Settings, Play, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSavedFoods, getFoodItems } from '../api/food';
import { getFoodPartnerById } from '../api/foodPartner';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import EditProfileModal from '../components/EditProfileModal';
import PostLightbox from '../components/PostLightbox';
import './Profile.css';

export default function Profile() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(role === 'partner' ? 'posts' : 'saved');
  const [savedFoods, setSavedFoods] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (role === 'partner') {
      try {
        const partnerRes = await getFoodPartnerById(user._id);
        setAllFoods(partnerRes.data.foodPartner.foodItems || []);
      } catch (e) {}
    } else {
      try {
        const savedRes = await getSavedFoods();
        setSavedFoods(savedRes.data.savedFoods?.map(s => s.food) || []);
      } catch (e) {
        setSavedFoods([]);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.fullName || user?.name || 'User';
  const email = user?.email || '';
  const bio = user?.bio || '';

  const displayedFoods = activeTab === 'saved' ? savedFoods : allFoods;

  return (
    <>
      <div className="profile-page">
        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-header-top">
            {/* Clickable avatar — opens edit modal */}
            <div className="profile-avatar-wrapper" onClick={() => setEditOpen(true)}>
              <Avatar
                src={user?.avatar}
                name={displayName}
                size={84}
                className="profile-avatar-lg"
              />
              <div className="profile-avatar-edit-hint">
                <Settings size={14} />
              </div>
            </div>

            <div className="profile-stats">
              {role === 'partner' && (
                <div className="profile-stat">
                  <span className="stat-number">{allFoods.length}</span>
                  <span className="stat-label">Posts</span>
                </div>
              )}
              <div className="profile-stat">
                <span className="stat-number">
                  {role === 'partner'
                    ? allFoods.reduce((a, f) => a + (f.likeCount || 0), 0)
                    : savedFoods.reduce((a, f) => a + (f?.likeCount || 0), 0)}
                </span>
                <span className="stat-label">Likes</span>
              </div>
              <div className="profile-stat">
                <span className="stat-number">{savedFoods.length}</span>
                <span className="stat-label">Saved</span>
              </div>
            </div>
          </div>

          <div className="profile-info">
            <h2>{displayName}</h2>
            <p className="profile-email">{email}</p>
            <p className="profile-role">{role === 'partner' ? '🍳 Food Vendor' : '🍽️ Foodie'}</p>
            {bio && <p className="profile-bio">{bio}</p>}
          </div>

          <div className="profile-actions-row">
            <button className="btn-secondary profile-edit-btn" onClick={() => setEditOpen(true)}>
              <Settings size={16} /> Edit Profile
            </button>
            <button className="btn-secondary profile-logout-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="profile-tabs">
          {role === 'partner' && (
            <button className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
              <Grid3X3 size={18} /> <span>Posts</span>
            </button>
          )}
          <button className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            <Bookmark size={18} /> <span>Saved</span>
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="profile-grid-skeleton">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '1' }} />)}
          </div>
        ) : displayedFoods.length === 0 ? (
          <div className="profile-empty-tab">
            {activeTab === 'saved' ? (
              <>
                <Bookmark size={36} />
                <h3>No saved posts</h3>
                <p>Save food videos to view them here</p>
              </>
            ) : (
              <>
                <Grid3X3 size={36} />
                <h3>No posts yet</h3>
                <p>Upload your first food video!</p>
              </>
            )}
          </div>
        ) : (
          <motion.div className="profile-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {displayedFoods.map((food, i) => (
              <motion.div
                key={food?._id || i}
                className="profile-grid-item"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedFood(food)}
              >
                {food?.mediaType === 'image' || food?.video?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                  <img src={food?.video?.includes('imagekit.io') && !food?.video?.includes('tr=') ? `${food.video}?tr=orig-true` : food?.video} className="profile-grid-video" alt="Food" style={{objectFit: 'cover'}} />
                ) : (
                  <video muted preload="metadata" className="profile-grid-video"
                    onMouseEnter={e => e.target.play()}
                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                  >
                    <source src={food?.video ? `${food.video}?tr=orig-true#t=1.0` : ''} type="video/mp4" />
                  </video>
                )}
                <div className="profile-grid-overlay">
                  <div className="profile-grid-stat"><Heart size={14} fill="white" /> {food?.likeCount || 0}</div>
                  {food?.mediaType !== 'image' && !food?.video?.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
                    <Play size={16} fill="white" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Post Lightbox Modal */}
        {selectedFood && (
          <PostLightbox
            foods={displayedFoods}
            selectedIndex={displayedFoods.findIndex(f => f._id === selectedFood._id)}
            onClose={() => setSelectedFood(null)}
            onNavigate={(dir) => {
              const currentIdx = displayedFoods.findIndex(f => f._id === selectedFood._id);
              const nextIdx = currentIdx + dir;
              if (nextIdx >= 0 && nextIdx < displayedFoods.length) {
                setSelectedFood(displayedFoods[nextIdx]);
              }
            }}
            onFoodDeleted={(id) => {
              setAllFoods(prev => prev.filter(f => f._id !== id));
              setSavedFoods(prev => prev.filter(f => f?._id !== id));
              setSelectedFood(null);
            }}
            onFoodUpdated={(updatedFood) => {
              setAllFoods(prev => prev.map(f => f._id === updatedFood._id ? updatedFood : f));
              setSavedFoods(prev => prev.map(f => f?._id === updatedFood._id ? updatedFood : f));
              setSelectedFood(updatedFood);
            }}
          />
        )}
      </div>

      {/* Edit Profile Modal — rendered outside main div to avoid z-index issues */}
      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}

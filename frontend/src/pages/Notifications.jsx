import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, UserPlus, Bell, UtensilsCrossed, Reply } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllVendors, followVendor, getUserNotifications, getVendorNotifications } from '../api/notifications';
import Loader from '../components/Loader';
import './Notifications.css';

export default function Notifications() {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (role === 'partner') {
        const res = await getVendorNotifications();
        setNotifications(res.data.notifications || []);
      } else {
        const [notifRes, vendorRes] = await Promise.allSettled([
          getUserNotifications(),
          getAllVendors()
        ]);
        if (notifRes.status === 'fulfilled') {
          setNotifications(notifRes.value.data.notifications || []);
        }
        if (vendorRes.status === 'fulfilled') {
          setVendors(vendorRes.value.data.vendors || []);
        }
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
    setLoading(false);
  };

  const handleFollow = async (vendorId) => {
    try {
      const res = await followVendor(vendorId);
      // Update local state
      setVendors(prev => prev.map(v =>
        v._id === vendorId
          ? { ...v, isFollowed: res.data.followed, followerCount: v.followerCount + (res.data.followed ? 1 : -1) }
          : v
      ));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return { Icon: Heart, color: 'var(--accent-red)' };
      case 'comment': return { Icon: MessageCircle, color: 'var(--primary)' };
      case 'reply': return { Icon: Reply, color: '#60a5fa' };
      case 'save': return { Icon: Bookmark, color: 'var(--accent-gold)' };
      case 'follow': return { Icon: UserPlus, color: '#a78bfa' };
      case 'new_post': return { Icon: UtensilsCrossed, color: 'var(--primary)' };
      default: return { Icon: Bell, color: 'var(--text-secondary)' };
    }
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const groupNotifications = (items) => {
    const today = [], thisWeek = [], earlier = [];
    const now = Date.now();
    items.forEach((n) => {
      const diff = now - new Date(n.createdAt).getTime();
      const hours = diff / 3600000;
      if (hours < 24) today.push(n);
      else if (hours < 168) thisWeek.push(n);
      else earlier.push(n);
    });
    return { today, thisWeek, earlier };
  };

  // Vendor filters
  const vendorFilters = [
    { id: 'all', label: 'All' },
    { id: 'follow', label: 'Follows' },
    { id: 'like', label: 'Likes' },
    { id: 'comment', label: 'Comments' },
    { id: 'save', label: 'Saves' },
  ];

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const { today, thisWeek, earlier } = groupNotifications(filtered);

  if (loading) return <div style={{ padding: '2rem' }}><Loader text="Loading notifications..." /></div>;

  return (
    <div className="notifications-page">
      <motion.header
        className="notif-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Notifications</h1>

        {role === 'partner' && (
          <div className="notif-filters">
            {vendorFilters.map((f) => (
              <button
                key={f.id}
                className={`notif-filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </motion.header>

      {/* User view: Suggested vendors to follow */}
      {role !== 'partner' && vendors.length > 0 && (
        <motion.div
          className="notif-follow-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="notif-section-title">Food Vendors</h3>
          <div className="notif-vendor-list">
            {vendors.map((vendor) => (
              <motion.div
                key={vendor._id}
                className="notif-vendor-card"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="notif-vendor-avatar">
                  {vendor.name?.charAt(0)?.toUpperCase() || 'V'}
                </div>
                <div className="notif-vendor-info">
                  <span className="notif-vendor-name">{vendor.name}</span>
                  <span className="notif-vendor-meta">
                    {vendor.followerCount || 0} follower{vendor.followerCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  className={`notif-follow-btn ${vendor.isFollowed ? 'following' : ''}`}
                  onClick={() => handleFollow(vendor._id)}
                >
                  {vendor.isFollowed ? 'Following' : 'Follow'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notification list */}
      <div className="notif-list">
        {role !== 'partner' && notifications.length > 0 && (
          <h3 className="notif-section-title">Activity</h3>
        )}
        {today.length > 0 && (
          <NotifGroup title="Today" items={today} formatTime={formatTime} getIcon={getIcon} role={role} />
        )}
        {thisWeek.length > 0 && (
          <NotifGroup title="This Week" items={thisWeek} formatTime={formatTime} getIcon={getIcon} role={role} />
        )}
        {earlier.length > 0 && (
          <NotifGroup title="Earlier" items={earlier} formatTime={formatTime} getIcon={getIcon} role={role} />
        )}
        {filtered.length === 0 && (
          <div className="notif-empty">
            <Bell size={40} />
            <h3>No notifications yet</h3>
            <p>{role === 'partner'
              ? 'When users interact with your posts, you\'ll see it here'
              : 'Follow food vendors and interact with posts to see activity here'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifGroup({ title, items, formatTime, getIcon, role }) {
  return (
    <div className="notif-group">
      <h3 className="notif-group-title">{title}</h3>
      {items.map((n, i) => {
        const { Icon, color } = getIcon(n.type);
        const senderName = n.sender?.fullName || n.sender?.name || 'Someone';
        return (
          <motion.div
            key={n._id}
            className={`notif-item ${!n.read ? 'unread' : ''}`}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="notif-icon" style={{ background: `${color}20`, color }}>
              <Icon size={18} />
            </div>
            <div className="notif-content">
              <p>
                <strong>{senderName}</strong>{' '}
                {n.message || getDefaultMessage(n.type)}
              </p>
              <span className="notif-time">{formatTime(n.createdAt)}</span>
            </div>
            {!n.read && <div className="notif-unread-dot" />}
          </motion.div>
        );
      })}
    </div>
  );
}

function getDefaultMessage(type) {
  switch (type) {
    case 'like': return 'liked your post';
    case 'comment': return 'commented on your post';
    case 'reply': return 'replied to your comment';
    case 'save': return 'saved your post';
    case 'follow': return 'started following you';
    case 'new_post': return 'posted new content';
    default: return 'interacted with you';
  }
}

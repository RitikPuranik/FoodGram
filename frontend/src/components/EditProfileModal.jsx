import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, FileText, Save, Loader2 } from 'lucide-react';
import { updateProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './EditProfileModal.css';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, role, updateUserProfile } = useAuth();

  const [name, setName]           = useState(user?.fullName || user?.name || '');
  const [bio, setBio]             = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      if (role === 'partner') {
        formData.append('name', name);
      } else {
        formData.append('fullName', name);
      }
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await updateProfile(formData);
      const updated = res.data.profile;

      // Push changes into AuthContext so the whole app reflects them instantly
      updateUserProfile({
        fullName: updated.fullName,
        name: updated.name,
        bio: updated.bio,
        avatar: updated.avatar,
      });

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.fullName || user?.name || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="epm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="epm-modal glass"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="epm-header">
              <h2>Edit Profile</h2>
              <button className="epm-close" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form className="epm-form" onSubmit={handleSave}>
              {/* Avatar picker */}
              <div className="epm-avatar-section">
                <div className="epm-avatar-wrap">
                  <Avatar
                    src={avatarPreview}
                    name={displayName}
                    size={88}
                  />
                  <button
                    type="button"
                    className="epm-camera-btn"
                    onClick={() => fileRef.current?.click()}
                    aria-label="Change profile picture"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>
                <button type="button" className="epm-change-photo-text" onClick={() => fileRef.current?.click()}>
                  Change photo
                </button>
              </div>

              {/* Name */}
              <div className="epm-field">
                <label className="epm-label">
                  <User size={14} />
                  {role === 'partner' ? 'Restaurant / Shop Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  className="epm-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'partner' ? 'Your restaurant name' : 'Your full name'}
                  maxLength={80}
                />
              </div>

              {/* Bio */}
              <div className="epm-field">
                <label className="epm-label">
                  <FileText size={14} />
                  Bio
                </label>
                <textarea
                  className="epm-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell people a little about yourself..."
                  maxLength={200}
                  rows={3}
                />
                <span className="epm-char-count">{bio.length}/200</span>
              </div>

              {error && <p className="epm-error">{error}</p>}

              {/* Actions */}
              <div className="epm-actions">
                <button type="button" className="btn-secondary epm-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary epm-save" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

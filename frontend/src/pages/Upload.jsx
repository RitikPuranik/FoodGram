import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Video, Image as ImageIcon, CheckCircle, X } from 'lucide-react';
import { createFood } from '../api/food';
import TagInput from '../components/TagInput';
import './Upload.css';

export default function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (!videoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !videoFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('mama', videoFile);
      // Pass hashtags as a comma-separated string
      if (tags.length > 0) {
        formData.append('hashtags', tags.join(','));
      }

      await createFood(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="upload-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div 
          className="upload-card" 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <CheckCircle size={64} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h2>Upload Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Your delicious food video is now live.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <motion.div
        className="upload-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Share a Recipe</h1>
        <p>Upload your latest food creation to <span className="brand-name">{import.meta.env.VITE_APP_NAME || 'FoodGram'}</span></p>
      </motion.div>

      <motion.div
        className="upload-card glass"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form className="upload-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="video-upload">Food Media (Image or Video) *</label>
            <div className="file-upload-container">
              <input
                id="video-upload"
                type="file"
                accept="video/*,image/*"
                className="file-upload-input"
                onChange={handleFileChange}
                required
              />
              <UploadIcon size={32} className="file-upload-icon" />
              <span className="file-upload-text">Click or drag media here</span>
              <span className="file-upload-subtext">Images or MP4, WebM (Max 50MB)</span>
            </div>
            {videoFile && previewUrl && (
              <div className="file-preview" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: 'var(--accent-red)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }}
                  title="Remove media"
                >
                  <X size={16} />
                </button>
                {videoFile.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <video src={previewUrl} controls style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {videoFile.type.startsWith('image/') ? <ImageIcon size={16} /> : <Video size={16} />} 
                  {videoFile.name}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="food-name">Title *</label>
            <input
              id="food-name"
              type="text"
              className="form-input"
              placeholder="e.g. Spicy Garlic Noodles"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="food-desc">Description</label>
            <textarea
              id="food-desc"
              className="form-textarea"
              placeholder="Tell us about this dish..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Hashtags</label>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="e.g. pizza, spicy, vegan..."
            />
          </div>

          <button
            type="submit"
            className="btn-primary upload-submit-btn"
            disabled={loading || !name || !videoFile}
          >
            {loading ? <span className="spinner" /> : <><UploadIcon size={20} /> Upload Post</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

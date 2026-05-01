import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Video, CheckCircle } from 'lucide-react';
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
  const [tags, setTags] = useState([]);

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
        <p>Upload your latest food creation to FoodGram</p>
      </motion.div>

      <motion.div
        className="upload-card glass"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form className="upload-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="video-upload">Food Video *</label>
            <div className="file-upload-container">
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="file-upload-input"
                onChange={handleFileChange}
                required
              />
              <UploadIcon size={32} className="file-upload-icon" />
              <span className="file-upload-text">Click or drag video here</span>
              <span className="file-upload-subtext">MP4, WebM, or Ogg (Max 50MB)</span>
            </div>
            {videoFile && (
              <div className="file-preview">
                <Video size={16} /> {videoFile.name}
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

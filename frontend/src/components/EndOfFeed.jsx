import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import './EndOfFeed.css';

export default function EndOfFeed({ message = "You're all caught up!" }) {
  return (
    <motion.div 
      className="end-of-feed"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="end-of-feed-content">
        <motion.div 
          className="end-of-feed-icon-wrapper"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <div className="end-of-feed-glow" />
          <CheckCircle2 size={32} className="end-of-feed-icon" />
        </motion.div>
        
        <h3 className="end-of-feed-text">{message}</h3>
        <p className="end-of-feed-subtext">You've seen all the latest delicious updates.</p>
        
        <motion.div 
          className="end-of-feed-sparkle"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Sparkles size={16} />
        </motion.div>
      </div>
      
      <div className="end-of-feed-line" />
    </motion.div>
  );
}

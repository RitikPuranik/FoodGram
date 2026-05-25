import React, { useState, useEffect, useRef } from 'react';
import './Auth.css';

// Importing local video assets
import video1 from '../../assets/video/video1.mp4';
import video3 from '../../assets/video/video3.mp4';

const videos = [video1, video3];

export default function VideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [crossfading, setCrossfading] = useState(false);
  
  const currentVideoRef = useRef(null);
  const nextVideoRef = useRef(null);

  const handleTimeUpdate = () => {
    if (!currentVideoRef.current) return;
    
    const { duration, currentTime } = currentVideoRef.current;
    
    // Start crossfade 1 second before current video ends
    if (duration - currentTime <= 1.0 && !crossfading) {
      setCrossfading(true);
      if (nextVideoRef.current) {
        nextVideoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
      }
    }
  };

  const handleCurrentEnded = () => {
    setCurrentIndex(nextIndex);
    setNextIndex((nextIndex + 1) % videos.length);
    setCrossfading(false);
  };

  return (
    <div className="video-background-container">
      {/* Current Video */}
      <video
        ref={currentVideoRef}
        src={videos[currentIndex]}
        className={`background-video ${crossfading ? 'fade-out' : 'fade-in'}`}
        autoPlay
        muted
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleCurrentEnded}
      />
      
      {/* Next Video (Preloading and playing during crossfade) */}
      <video
        ref={nextVideoRef}
        src={videos[nextIndex]}
        className={`background-video ${crossfading ? 'fade-in' : 'hidden'}`}
        muted
        playsInline
        preload="auto"
      />

      {/* Overlays for aesthetics */}
      <div className="video-overlay" />
      <div className="grain-overlay" />
    </div>
  );
}

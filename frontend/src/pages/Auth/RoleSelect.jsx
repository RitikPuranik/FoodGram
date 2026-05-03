import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { UtensilsCrossed, Store, ArrowRight } from 'lucide-react';
import './Auth.css';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <motion.div
        className="role-selection-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <header className="role-header">
          <motion.span 
            className="badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Entry Protocol
          </motion.span>
          <h1 className="brand-logo">{import.meta.env.VITE_APP_NAME || 'FoodGram'}</h1>
          <p className="subtitle">Select your interface to begin</p>
        </header>

        <div className="role-grid">
          <RoleCard 
            icon={<UtensilsCrossed size={32} strokeWidth={1.5} />}
            title="Foodie"
            desc="Explore the culinary map and curate your private collection."
            onClick={() => navigate('/login?role=user')}
          />
          
          <RoleCard 
            icon={<Store size={32} strokeWidth={1.5} />}
            title="Vendor"
            desc="Scale your kitchen operations with professional insights."
            onClick={() => navigate('/login?role=partner')}
            isPrimary
          />
        </div>
      </motion.div>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick, isPrimary }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spotlight effect logic
  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.button
      className={`glass-card ${isPrimary ? 'primary-card' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* The Dynamic Spotlight */}
      <motion.div 
        className="spotlight"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`
          )
        }}
      />

      <div className="card-inner">
        <div className="icon-sphere">
          <div className="icon-glow" />
          {icon}
        </div>
        
        <div className="text-content">
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>

        <div className="card-footer">
          <span>Initialize</span>
          <ArrowRight size={18} className="arrow-icon" />
        </div>
      </div>
    </motion.button>
  );
}
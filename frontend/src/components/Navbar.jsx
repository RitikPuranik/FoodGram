import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Film, Bell, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './Navbar.css';

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/reels', icon: Film, label: 'Reels' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Navbar() {
  const { role } = useAuth();
  const location = useLocation();

  // Hide navbar on auth pages
  if (['/', '/login', '/signup'].includes(location.pathname)) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hide-mobile">
        <div className="sidebar-inner">
          <NavLink to="/home" className="sidebar-logo">
            <div className="logo-icon">
              <span>🍕</span>
            </div>
            <span className="logo-text gradient-text brand-name">{import.meta.env.VITE_APP_NAME || 'FoodGram'}</span>
          </NavLink>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <div className="sidebar-link-icon">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isActive && (
                      <motion.div
                        className="sidebar-active-bg"
                        layoutId="sidebar-active"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className="sidebar-link-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {role === 'partner' && (
            <NavLink to="/upload" className="sidebar-upload-btn btn-primary">
              <Plus size={20} />
              <span>Upload</span>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav hide-desktop glass">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          // Insert upload button in the middle for partners
          if (i === 2 && role === 'partner') {
            return (
              <div key="upload-group" className="bottom-nav-center-group">
                <NavLink
                  to={item.path}
                  className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{item.label}</span>
                </NavLink>
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {isActive && (
                <motion.div
                  className="bottom-nav-active-dot"
                  layoutId="bottom-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

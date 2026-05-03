/**
 * Avatar — shows profile picture if available, otherwise shows initial letter.
 * Props:
 *   src      — image URL (nullable)
 *   name     — display name (used for initial fallback)
 *   size     — px size (default 40)
 *   className — extra CSS class
 */
export default function Avatar({ src, name, size = 40, className = '', onClick }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const style = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.38,
    fontWeight: 800,
    color: 'white',
    background: 'var(--primary-gradient)',
    boxShadow: '0 4px 12px rgba(255,87,34,0.25)',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
  };

  return (
    <div className={`avatar-root ${className}`} style={style} onClick={onClick}>
      {src ? (
        <img
          src={src.includes('imagekit.io') && !src.includes('tr=') ? `${src}?tr=w-200,h-200,orig-true` : src}
          alt={name || 'avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      {/* Fallback initial — hidden if img loads */}
      <span style={{ display: src ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {initial}
      </span>
    </div>
  );
}

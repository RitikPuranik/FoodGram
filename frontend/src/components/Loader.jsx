import './Loader.css';

export default function Loader({ size = 'md', text = '' }) {
  return (
    <div className="loader-container">
      <div className={`loader-spinner loader-${size}`}>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}

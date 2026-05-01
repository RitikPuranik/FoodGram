import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import './TagInput.css';

const MAX_TAGS = 10;

/**
 * TagInput — multi-hashtag input component.
 * Props:
 *   tags       — string[]   (controlled)
 *   onChange   — (tags) => void
 *   placeholder — string
 */
export default function TagInput({ tags = [], onChange, placeholder = 'Add hashtags...' }) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  const normalise = (raw) =>
    raw.trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '');

  const addTag = useCallback((raw) => {
    const tag = normalise(raw);
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
    setInputVal('');
  }, [tags, onChange]);

  const removeTag = (idx) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputVal.trim()) addTag(inputVal);
  };

  return (
    <div className="tag-input-wrapper">
      <div
        className="tag-input-field"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span key={tag} className="tag-chip">
            <span className="tag-chip-text">#{tag}</span>
            <button
              type="button"
              className="tag-chip-remove"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              aria-label={`Remove #${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {tags.length < MAX_TAGS && (
          <input
            ref={inputRef}
            className="tag-input-text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={tags.length === 0 ? placeholder : ''}
            aria-label="Add a hashtag"
          />
        )}
      </div>

      <p className="tag-input-hint">
        Press <kbd>Enter</kbd>, <kbd>,</kbd> or <kbd>Space</kbd> to add a tag — max {MAX_TAGS}.
      </p>
    </div>
  );
}

import React, { useState } from 'react';

export default function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const addTag = (raw) => {
    const t = raw.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div className="pb-tags-wrap" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
      {value.map(t => (
        <span key={t} className="pb-tag">
          {t}
          <button type="button" className="pb-tag-rm" onClick={() => onChange(value.filter(v => v !== t))}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </span>
      ))}
      <input
        className="pb-tag-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (['Enter','Tab',','].includes(e.key) && draft.trim()) { e.preventDefault(); addTag(draft); }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0,-1));
        }}
        onBlur={() => { if (draft.trim()) addTag(draft); }}
        placeholder={value.length ? '' : placeholder}
      />
    </div>
  );
}

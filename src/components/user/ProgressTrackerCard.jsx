import React from 'react';

const STEPS = [
  { label: 'Profile completed', done: true },
  { label: 'Github connected', done: true },
  { label: 'Skills verified', done: true },
  { label: 'Roadmap started', done: true },
  { label: 'First application sent', done: true },
  { label: 'Earn 1 certification', done: false },
];

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function ProgressTrackerCard() {
  const done = STEPS.filter(s => s.done).length;
  const total = STEPS.length;

  return (
    <div className="ptc-card">
      <div className="ptc-header">
        <h3 className="ptc-title">Progress tracker</h3>
        <span className="ptc-count">{done}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="ptc-track">
        <div className="ptc-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {/* Steps */}
      <div className="ptc-list">
        {STEPS.map((s, i) => (
          <div key={i} className={`ptc-step${s.done ? ' ptc-step--done' : ''}`}>
            <span className={`ptc-check${s.done ? ' ptc-check--done' : ''}`}>
              {s.done ? <IconCheck /> : null}
            </span>
            <span className="ptc-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

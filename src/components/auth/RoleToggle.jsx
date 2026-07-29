import React from 'react';

/* ─── Role Toggle: Candidate / Company ─── */
export default function RoleToggle({ role, setRole }) {
  return (
    <div className="auth-role-toggle">
      <button
        id="role-candidate"
        className={`auth-role-btn ${role === 'candidate' ? 'active' : ''}`}
        onClick={() => setRole('candidate')}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Candidate
      </button>
      <button
        id="role-company"
        className={`auth-role-btn ${role === 'company' ? 'active' : ''}`}
        onClick={() => setRole('company')}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
        Company
      </button>
    </div>
  );
}
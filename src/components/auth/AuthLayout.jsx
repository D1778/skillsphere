import React from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../../hooks/useTheme';
import { SkillSphereLogo } from '../shared/Logo';

/* ─── Theme toggle ─── */
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="auth-theme-toggle"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

/* ─── Full-page auth layout — inherits homepage background ─── */
export default function AuthLayout({ children, backTo = '/', backLabel = 'Back to Home' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="auth-root">
      {/* Top bar */}
      <div className="auth-topbar">
        <Link to={backTo} className="auth-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      {/* Centered card */}
      <div className="auth-center">
        <div className="auth-card">
          {/* Homepage logo */}
          <div className="auth-logo-block">
            <SkillSphereLogo size={40} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signout } from '../../services/api';

/* ─── Inline SVG icons ─── */
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconJobs = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconPeople = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconPlusCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconFileText = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconCompanyTeam = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6.5" cy="8.5" r="2" />
    <path d="M2.5 14a4 4 0 0 1 5 -1.5" />
    <circle cx="17.5" cy="8.5" r="2" />
    <path d="M21.5 14a4 4 0 0 0 -5 -1.5" />
    <circle cx="12" cy="6" r="2.5" />
    <path d="M7.5 14a4.5 4.5 0 0 1 9 0" />
    <path d="M12 9.5 l-0.5 2 l0.5 1 l0.5 -1 z" fill="currentColor" stroke="none" />
    <path d="M11 9.5 l1 1 l1 -1" />
    <rect x="2" y="14" width="20" height="7" rx="1.5" />
    <line x1="6" y1="16.5" x2="18" y2="16.5" strokeWidth="1.5" />
    <line x1="6" y1="19" x2="14" y2="19" strokeWidth="1.5" />
  </svg>
);

const IconMenuToggle = ({ isOpen }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1={isOpen ? "19" : "3"} y1={isOpen ? "12" : "6"} x2={isOpen ? "5" : "21"} y2={isOpen ? "12" : "6"} className="transition-all duration-300" />
    <line x1={isOpen ? "12" : "3"} y1={isOpen ? "19" : "12"} x2={isOpen ? "5" : "15"} y2={isOpen ? "12" : "12"} className="transition-all duration-300" />
    <line x1={isOpen ? "12" : "3"} y1={isOpen ? "5"  : "18"} x2={isOpen ? "5" : "21"} y2={isOpen ? "12" : "18"} className="transition-all duration-300" />
  </svg>
);

// NAV_ITEMS moved inside Sidebar

export default function Sidebar({ role = 'Candidate', isExpanded, setIsExpanded }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [photoError, setPhotoError] = useState(false);

  const CANDIDATE_NAV = [
    { to: '/dashboard/candidate', icon: <IconDashboard />, label: 'Dashboard' },
    { to: '/jobs',                icon: <IconJobs />,      label: 'Jobs' },
    { to: '/roadmap',             icon: <IconPeople />,    label: 'Career Roadmap' },
    { to: '/analytics',           icon: <IconChart />,     label: 'Analytics' },
    { to: '/profile',             icon: <IconProfile />,   label: 'Profile'   },
  ];

  const RECRUITER_NAV = [
    { to: '/dashboard/company', icon: <IconDashboard />, label: 'Dashboard' },
    { to: '/postings',          icon: <IconPlusCircle />, label: 'Post a job' },
    { to: '/applications',      icon: <IconFileText />,  label: 'Applications' },
    { to: '/candidates',        icon: <IconPeople />,    label: 'Candidates' },
    { to: '/company-profile',   icon: <IconCompanyTeam />, label: 'Company Profile' },
  ];

  const NAV_ITEMS = role === 'Recruiter' ? RECRUITER_NAV : CANDIDATE_NAV;

  // Real signed-in user, not a hardcoded placeholder. Falls back to the
  // generic role label only in the brief window before /me resolves.
  const displayName = user?.displayName?.trim() || (role === 'Recruiter' ? 'Company account' : 'Candidate account');
  const roleLabel = user?.role === 'company' ? 'Company' : user?.role === 'candidate' ? 'Candidate' : role;
  const initials = displayName
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || (role === 'Recruiter' ? 'HR' : 'US');

  const handleLogout = async () => {
    try { await signout(); } catch { /* tokens are cleared locally either way */ }
    setUser(null);
    navigate('/signin');
  };

  useEffect(() => { setPhotoError(false); }, [user?.photoURL]);

  return (
    <>
    {/* Mobile Backdrop — absolute against the body-area box (which already
        excludes the topbar), so no manual top offset is needed here either */}
    {isExpanded && (
      <div 
        className="sm:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-[150]" 
        onClick={() => setIsExpanded(false)}
      />
    )}

    {/* Sidebar / Drawer — absolutely positioned against the body-area box
        (which is `relative`), filling its full height. This tracks the
        topbar's real rendered height automatically instead of assuming
        56px, so it can never drift out of alignment. */}
    <aside className={`group/sidebar absolute left-0 top-0 h-full bg-[var(--bg-nav)] border-r border-[var(--divider)] flex flex-col items-start overflow-hidden z-[200] backdrop-blur-xl transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[4px_0_40px_rgba(0,0,0,0.45)]
      ${isExpanded ? 'w-[200px] shadow-[4px_0_40px_rgba(0,0,0,0.45)]' : 'w-[60px] hover:w-[200px]'}
    `}>
      
      {/* Menu toggle area */}
      <div className="flex items-center gap-3 h-14 px-3.5 border-b border-[var(--divider)] whitespace-nowrap overflow-hidden min-w-[200px] shrink-0">
        <button 
          className="shrink-0 flex items-center justify-center w-9 h-9 bg-transparent text-gray-400 rounded-lg transition-all hover:bg-gray-500/10 hover:text-white" 
          aria-label="Toggle Menu"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <IconMenuToggle isOpen={isExpanded} />
        </button>
        <span className={`flex items-center gap-2 font-sans text-[0.82rem] font-medium tracking-tight text-white transition-all duration-[220ms] delay-75 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1.5'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          Main Menu
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-3 flex-1 pt-2 px-2 w-full">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (window.innerWidth < 640) {
                setIsExpanded(false);
              }
            }}
            className={({ isActive }) => 
              `flex items-center gap-3.5 w-full p-3 rounded-lg text-gray-400 no-underline transition-all cursor-pointer border border-transparent bg-transparent hover:bg-gray-500/5 hover:text-white group/navitem ${
                isActive ? '!bg-gradient-to-r !from-cyan-500/20 !to-cyan-500/8 !text-cyan-200 shadow-[inset_3px_0_0_0_#22d3ee,inset_0_0_0_1px_rgba(34,211,238,0.15)] active-navitem' : ''
              }`
            }
          >
            <span className="shrink-0 flex items-center justify-center transition-transform duration-200 group-hover/navitem:scale-110 group-[.active-navitem]/navitem:text-cyan-400 text-inherit">
              {item.icon}
            </span>
            <span className={`font-sans text-[0.83rem] font-normal tracking-tight whitespace-nowrap transition-all duration-200 delay-75 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 sm:group-hover/sidebar:opacity-100 sm:group-hover/sidebar:translate-x-0 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="w-full p-2 flex flex-col gap-1.5 mt-auto">
        <div className="w-[calc(100%-24px)] mx-3 my-1 h-px bg-[var(--divider)] shrink-0" />

        {/* User row — links to the account page. Shows the real signed-in
            user's photo when they have one, falling back to initials. */}
        <Link
          to="/account"
          onClick={() => { if (window.innerWidth < 640) setIsExpanded(false); }}
          className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-gray-500/5 whitespace-nowrap overflow-hidden no-underline"
        >
          <div className="shrink-0 w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white font-sans text-sm font-bold shadow-[0_4px_12px_rgba(34,211,238,0.3)] overflow-hidden">
            {user?.photoURL && !photoError ? (
              <img src={user.photoURL} alt={displayName} onError={() => setPhotoError(true)} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className={`flex flex-col transition-all duration-200 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 sm:group-hover/sidebar:opacity-100 sm:group-hover/sidebar:translate-x-0 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
            <span className="font-sans text-[0.83rem] font-medium tracking-tight text-white truncate max-w-[130px]">
              {displayName}
            </span>
            <span className="text-[0.72rem] text-gray-400 font-medium tracking-wide">
              {roleLabel}
            </span>
          </div>
        </Link>

        {/* Logout */}
        <button className="flex items-center gap-3.5 w-full p-3 rounded-lg text-red-400 no-underline transition-all cursor-pointer border border-transparent bg-transparent hover:bg-red-400/10 hover:text-red-300 group/logout" onClick={handleLogout}>
          <span className="shrink-0 flex items-center justify-center transition-transform duration-200 group-hover/logout:scale-110">
            <IconLogout />
          </span>
          <span className={`font-sans text-[0.83rem] font-normal tracking-tight whitespace-nowrap transition-all duration-200 delay-75 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 sm:group-hover/sidebar:opacity-100 sm:group-hover/sidebar:translate-x-0 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
            Log out
          </span>
        </button>
      </div>
    </aside>
    </>
  );
}
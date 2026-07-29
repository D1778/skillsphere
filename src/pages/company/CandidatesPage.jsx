import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogoMark } from '../../components/shared/Topbar';
import { searchCandidates } from '../../services/api';
import CandidateProfileModal from '../../components/modals/CandidateProfileModal';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

const IconSearch = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconMapPin = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconChevronDown = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconChevronLeft = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconDotsVertical = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const IconCircleCheck = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconLinkedin = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>
  </svg>
);
const IconGithub = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);
const IconMail = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const SKILLS_OPTIONS = ['React', 'Node.js', 'Next.js', 'Figma', 'Product Strategy', 'Agile', 'TypeScript', 'MongoDB', 'Python', 'Java', 'SQL', 'AWS'];
const EXPERIENCE_OPTIONS = ['0 - 1 years', '1 - 3 years', '3 - 5 years', '5+ years'];
const LOCATION_OPTIONS = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Singapore', 'United Arab Emirates'];
const SORT_OPTIONS = ['Recently Joined', 'Highest Experience', 'Name (A-Z)'];

// Debounce free-text search so every keystroke doesn't fire a request.
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const AVATAR_PALETTE = [
  'from-indigo-500 to-purple-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500', 'from-pink-500 to-rose-500', 'from-violet-500 to-fuchsia-500',
];
const paletteFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

/**
 * Candidate avatar — previously this fell back to an external
 * `https://i.pravatar.cc/...` placeholder whenever a candidate had no
 * uploaded photo. If that third-party service is unreachable (blocked
 * network, offline preview, ad-blocker, etc.) the browser just shows a
 * broken-image icon with the alt text bleeding through — which is
 * exactly the "not showing photo" bug. This renders initials as real
 * DOM content instead (zero network requests, never breaks), and only
 * attempts the real photo when one was actually uploaded — falling
 * back to initials automatically if that image fails to load too.
 */
function CandidateAvatar({ src, name, verified, size = 48 }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="w-full h-full rounded-full object-cover border border-[var(--border-card)]"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${paletteFor(name)} flex items-center justify-center border border-[var(--border-card)]`}
        >
          <span className="font-sans font-bold text-white" style={{ fontSize: size * 0.36 }}>{initials}</span>
        </div>
      )}
      {verified && (
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--bg-card)]"></div>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 400);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedExp, setSelectedExp] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [sortBy, setSortBy] = useState('Recently Joined');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [revealedEmailId, setRevealedEmailId] = useState(null);
  const [openSocialMenuId, setOpenSocialMenuId] = useState(null);

  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeCandidateId, setActiveCandidateId] = useState(null);

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedExp, selectedLoc, selectedSkills, sortBy]);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchCandidates({
        search: debouncedSearch,
        skills: selectedSkills,
        location: selectedLoc,
        experience: selectedExp,
        sortBy,
        page: currentPage,
        limit: 10,
      });
      setCandidates(result.candidates || []);
      setPagination(result.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch {
      setError('Could not load candidates. Please try again.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSkills, selectedLoc, selectedExp, sortBy, currentPage]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const toggleFilter = (setFn, val) => {
    setFn(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const clearAll = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedExp([]);
    setSelectedLoc([]);
    setSelectedSkills([]);
  };

  const openProfile = (candidateId) => {
    setActiveCandidateId(candidateId);
    setProfileModalOpen(true);
  };

  const FILTERED_LOCATIONS = LOCATION_OPTIONS
    .filter(loc => loc.toLowerCase().includes(locationQuery.toLowerCase()))
    .map(label => ({ label }));

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 mt-0">
        <div className="flex flex-col">
          <div className="mb-1 min-h-[8px]"></div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-sans tracking-tight leading-tight">
            Candidates
          </h1>
          <p className="font-sans text-[0.95rem] text-[var(--text-muted)] mt-1.5 font-medium">
            Discover and connect with top talent for your organization.
          </p>
        </div>
      </div>

      {/* ── Top Filters Row ── */}
      <div className="relative z-50 card-glass p-3 rounded-2xl flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search by name, skills, title or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-body)] border border-[var(--border-card)] text-[var(--text-primary)] text-[0.85rem] font-sans pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Dropdowns */}
        <div className="relative" ref={activeDropdown === 'skills' ? dropdownRef : null}>
          <button onClick={() => setActiveDropdown(activeDropdown === 'skills' ? null : 'skills')} className="flex items-center justify-between min-w-[140px] px-4 py-2.5 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-xl font-sans text-[0.85rem] text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-all">
            {selectedSkills.length > 0 ? `${selectedSkills.length} Skills` : 'All Skills'} <IconChevronDown size={16} />
          </button>
          {activeDropdown === 'skills' && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-xl p-2 z-50 border border-[var(--border-card)] shadow-2xl max-h-[350px] overflow-y-auto" style={{ backgroundColor: 'var(--bg-panel)' }}>
              {SKILLS_OPTIONS.map(skill => {
                const isChecked = selectedSkills.includes(skill);
                return (
                  <label key={skill} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--bg-card-hover)] rounded-lg group transition-colors">
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-card)] group-hover:border-[var(--accent)] bg-[var(--bg-body)]'}`}>
                      {isChecked && <IconCircleCheck size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleFilter(setSelectedSkills, skill)} />
                    <span className="font-sans text-[0.85rem] text-[var(--text-primary)] truncate">{skill}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={activeDropdown === 'exp' ? dropdownRef : null}>
          <button onClick={() => setActiveDropdown(activeDropdown === 'exp' ? null : 'exp')} className="flex items-center justify-between min-w-[140px] px-4 py-2.5 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-xl font-sans text-[0.85rem] text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-all">
            {selectedExp.length > 0 ? `${selectedExp.length} Experience` : 'All Experience'} <IconChevronDown size={16} />
          </button>
          {activeDropdown === 'exp' && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-xl p-2 z-50 border border-[var(--border-card)] shadow-2xl" style={{ backgroundColor: 'var(--bg-panel)' }}>
              {EXPERIENCE_OPTIONS.map(exp => {
                const isChecked = selectedExp.includes(exp);
                return (
                  <label key={exp} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--bg-card-hover)] rounded-lg group transition-colors">
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-card)] group-hover:border-[var(--accent)] bg-[var(--bg-body)]'}`}>
                      {isChecked && <IconCircleCheck size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleFilter(setSelectedExp, exp)} />
                    <span className="font-sans text-[0.85rem] text-[var(--text-primary)] truncate">{exp}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={activeDropdown === 'loc' ? dropdownRef : null}>
          <button onClick={() => setActiveDropdown(activeDropdown === 'loc' ? null : 'loc')} className="flex items-center justify-between min-w-[140px] px-4 py-2.5 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-xl font-sans text-[0.85rem] text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-all">
            {selectedLoc.length > 0 ? `${selectedLoc.length} Location` : 'All Location'} <IconChevronDown size={16} />
          </button>
          {activeDropdown === 'loc' && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-xl p-2 z-50 border border-[var(--border-card)] shadow-2xl max-h-[350px] overflow-y-auto" style={{ backgroundColor: 'var(--bg-panel)' }}>
              {FILTERED_LOCATIONS.slice(0, 8).map(loc => {
                const isChecked = selectedLoc.includes(loc.label);
                return (
                  <label key={loc.label} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--bg-card-hover)] rounded-lg group transition-colors">
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-card)] group-hover:border-[var(--accent)] bg-[var(--bg-body)]'}`}>
                      {isChecked && <IconCircleCheck size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleFilter(setSelectedLoc, loc.label)} />
                    <span className="font-sans text-[0.85rem] text-[var(--text-primary)] truncate">{loc.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={clearAll} className="px-4 py-2.5 text-[var(--accent)] font-sans text-[0.85rem] font-semibold hover:opacity-80 transition-opacity ml-auto">
          Reset
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Sidebar Filters ── */}
        <div className="w-full lg:w-[260px] shrink-0 card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans font-bold text-[0.95rem] text-[var(--text-primary)]">Filters</h3>
            <button onClick={clearAll} className="text-[0.75rem] font-sans font-semibold text-[var(--accent)] hover:underline">Clear All</button>
          </div>

          {/* Experience */}
          <div className="mb-6">
            <h4 className="font-sans font-semibold text-[0.85rem] text-[var(--text-primary)] mb-3">Experience</h4>
            <div className="flex flex-col gap-2.5">
              {EXPERIENCE_OPTIONS.map(opt => {
                const isChecked = selectedExp.includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${isChecked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-card)] group-hover:border-[var(--accent)] bg-transparent'}`}>
                      {isChecked && <IconCircleCheck size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleFilter(setSelectedExp, opt)} />
                    <span className="font-sans text-[0.85rem] text-[var(--text-secondary)]">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[var(--border-card)] mb-6"></div>

          {/* Current Location */}
          <div>
            <h4 className="font-sans font-semibold text-[0.85rem] text-[var(--text-primary)] mb-3">Current Location</h4>
            <div className="relative mb-3">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
              <input
                type="text"
                placeholder="Search location..."
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-card)] text-[var(--text-primary)] text-[0.8rem] font-sans pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
            <div className="flex flex-col gap-2.5">
              {FILTERED_LOCATIONS.map(opt => {
                const isChecked = selectedLoc.includes(opt.label);
                return (
                  <label key={opt.label} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${isChecked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-card)] group-hover:border-[var(--accent)] bg-transparent'}`}>
                      {isChecked && <IconCircleCheck size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleFilter(setSelectedLoc, opt.label)} />
                    <span className="font-sans text-[0.85rem] text-[var(--text-secondary)]">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative z-40 flex items-center justify-between px-2 mb-4">
            <p className="font-sans text-[0.85rem] text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">{pagination.total}</span> Candidates found
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 relative" ref={activeDropdown === 'sort' ? dropdownRef : null}>
                <span className="font-sans text-[0.8rem] text-[var(--text-muted)]">Sort by:</span>
                <button onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')} className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent text-[var(--text-primary)] font-sans text-[0.85rem] font-medium rounded-lg hover:bg-[var(--bg-card-hover)] transition-all">
                  {sortBy} <IconChevronDown size={14} className="text-[var(--text-muted)]" />
                </button>
                {activeDropdown === 'sort' && (
                  <div className="absolute top-full right-0 mt-1 w-56 rounded-xl p-1.5 z-50 border border-[var(--border-card)] shadow-2xl" style={{ backgroundColor: 'var(--bg-panel)' }}>
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => { setSortBy(opt); setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 font-sans text-[0.85rem] rounded-lg transition-colors ${sortBy === opt ? 'text-[var(--accent)] font-semibold bg-[var(--bg-card-hover)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex bg-[var(--bg-card)] rounded-lg p-0.5 border border-[var(--border-card)]">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 font-sans text-[0.85rem]">
              {error}
            </div>
          )}

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 flex-1" : "card-glass rounded-2xl flex-1 flex flex-col overflow-hidden"}>
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-[var(--accent)]/40 border-t-[var(--accent)] rounded-full animate-spin" />
                <p className="font-sans text-[0.85rem] text-[var(--text-muted)]">Loading candidates…</p>
              </div>
            ) : candidates.length > 0 ? candidates.map((c, i) => {
              const displaySkills = c.skills.slice(0, 3);
              const extraSkillCount = c.skills.length - displaySkills.length;
              return (
              <div key={c.id} className={viewMode === 'grid'
                ? "card-glass rounded-2xl p-5 flex flex-col gap-4 border border-transparent hover:border-[var(--accent)] transition-all"
                : `p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors hover:bg-[var(--bg-card-hover)] ${i !== candidates.length - 1 ? 'border-b border-[var(--border-card)]' : ''}`
              }>

                {revealedEmailId === c.id ? (
                  <div className="w-full flex-1 flex flex-row items-center justify-between animate-fade-in py-1">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border border-[var(--border-card)] flex items-center justify-center shrink-0 shadow-sm">
                        <IconMail size={20} className="text-[var(--accent)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-[0.85rem] text-[var(--text-muted)] mb-0.5 font-medium">Reach out to {c.name.split(' ')[0]}</p>
                        <a href={`mailto:${c.email}`} className="font-sans text-[1.1rem] sm:text-[1.25rem] font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate block">{c.email}</a>
                      </div>
                    </div>
                    <button onClick={() => setRevealedEmailId(null)} className="p-2.5 rounded-full hover:bg-[var(--bg-body)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0 ml-4 shadow-sm bg-[var(--bg-card)]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Profile Info */}
                    <div className="flex items-center gap-4 flex-[1.5] min-w-0">
                      <CandidateAvatar src={c.avatar ? fileUrl(c.avatar) : null} name={c.name} verified={c.verified} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-sans font-bold text-[0.95rem] text-[var(--text-primary)] truncate">{c.name}</h4>
                          {c.verified && (
                            <IconCircleCheck size={14} className="text-[var(--accent)] shrink-0" />
                          )}
                        </div>
                        <p className="font-sans text-[0.8rem] text-[var(--text-secondary)] truncate mb-0.5">{c.role || '—'}</p>
                        <p className="font-sans text-[0.7rem] text-[var(--text-muted)]">
                          {c.joinedAt ? `Joined ${new Date(c.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex-1 min-w-0 hidden sm:block">
                      <p className="font-sans text-[0.7rem] text-[var(--text-muted)] mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {displaySkills.map(s => (
                          <span key={s} className="px-2 py-1 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-md font-sans text-[0.75rem] text-[var(--text-secondary)] whitespace-nowrap">
                            {s}
                          </span>
                        ))}
                        {extraSkillCount > 0 && (
                          <span className="px-2 py-1 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-md font-sans text-[0.75rem] text-[var(--text-secondary)] whitespace-nowrap">
                            +{extraSkillCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Experience & Location */}
                    <div className="flex gap-6 flex-[1.2] min-w-0 hidden sm:flex">
                      <div className="flex-1">
                        <p className="font-sans text-[0.7rem] text-[var(--text-muted)] mb-1">Experience</p>
                        <p className="font-sans text-[0.85rem] font-medium text-[var(--text-primary)]">{c.experience} yrs</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[0.7rem] text-[var(--text-muted)] mb-1">Location</p>
                        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <IconMapPin size={14} className="shrink-0" />
                          <span className="font-sans text-[0.8rem] truncate">{c.location || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex items-center shrink-0 mt-2 sm:mt-0 ${viewMode === 'grid' ? 'w-full justify-between' : 'gap-3 ml-auto sm:ml-0'}`}>
                      <button onClick={() => openProfile(c.id)} className="px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-card)] text-[var(--text-primary)] font-sans text-[0.8rem] font-semibold rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                        View Profile
                      </button>

                      <div className="relative flex items-center gap-1.5" onMouseLeave={() => setOpenSocialMenuId(null)}>
                        {openSocialMenuId === c.id && (
                          <div className="absolute right-full mr-1 flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-lg p-1 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
                            {c.linkedin && (
                              <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[var(--text-muted)] hover:text-[#0077b5] transition-colors rounded-md hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-card)]">
                                <IconLinkedin size={18} />
                              </a>
                            )}
                            {c.github && (
                              <a href={c.github} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[var(--text-muted)] hover:text-white transition-colors rounded-md hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-card)]">
                                <IconGithub size={18} />
                              </a>
                            )}
                            <button onClick={() => { setRevealedEmailId(c.id); setOpenSocialMenuId(null); }} className="p-1.5 text-[var(--text-muted)] hover:text-[#ea4335] transition-colors rounded-md hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-card)]">
                              <IconMail size={18} />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setOpenSocialMenuId(openSocialMenuId === c.id ? null : c.id)}
                          className={`p-1.5 transition-colors rounded-md hover:bg-[var(--bg-body)] border border-transparent hover:border-[var(--border-card)] ${openSocialMenuId === c.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                          <IconDotsVertical size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>
            );}) : (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <IconSearch className="text-[var(--text-muted)] mb-3" size={32} />
                <p className="font-sans font-medium text-[var(--text-primary)] text-[0.95rem]">No candidates found</p>
                <p className="font-sans text-[var(--text-muted)] text-[0.85rem] mt-1">Try adjusting your filters or search query.</p>
                <button onClick={clearAll} className="mt-4 px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-lg text-[0.85rem] font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">Clear Filters</button>
              </div>
            )}

            {/* Pagination */}
            {!loading && candidates.length > 0 && (
              <div className={`p-4 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 ${viewMode === 'list' ? 'border-t border-[var(--border-card)]' : 'card-glass rounded-2xl col-span-full'}`}>
                <p className="font-sans text-[0.8rem] text-[var(--text-muted)]">
                  Showing <span className="font-medium text-[var(--text-primary)]">{(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[var(--text-primary)]">{pagination.total}</span> candidates
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-card)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors disabled:opacity-50" disabled={currentPage === 1}>
                    <IconChevronLeft size={16} />
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(pNum => pNum === 1 || pNum === pagination.pages || Math.abs(pNum - currentPage) <= 1)
                    .reduce((acc, pNum, idx, arr) => {
                      if (idx > 0 && pNum - arr[idx - 1] > 1) acc.push('...');
                      acc.push(pNum);
                      return acc;
                    }, [])
                    .map((pNum, idx) => pNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 flex items-center justify-center text-[var(--text-muted)] font-sans text-[0.85rem]">...</span>
                    ) : (
                      <button key={pNum} onClick={() => setCurrentPage(pNum)} className={`w-8 h-8 flex items-center justify-center rounded-lg font-sans text-[0.85rem] transition-colors ${currentPage === pNum ? 'border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-bold' : 'border border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}>
                        {pNum}
                      </button>
                    ))}
                  <button onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors disabled:opacity-50" disabled={currentPage === pagination.pages}>
                    <IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <CandidateProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        candidateId={activeCandidateId}
      />
<<<<<<< HEAD
=======

      {/* Floating AI Chatbot button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0f172a] border border-[#22d3ee]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform z-50 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]">
        <div className="scale-125">
          <LogoMark />
        </div>
      </button>
>>>>>>> 47426fbb288e3196aea1ad02eb03427e6ffb1254
    </>
  );
}
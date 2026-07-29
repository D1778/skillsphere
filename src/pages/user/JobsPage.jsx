import React, { useState, useEffect, useMemo } from 'react';
import { LogoMark } from '../../components/shared/Topbar';
import ApplicationModal from '../../components/modals/ApplicationModal';
import { useJobs } from '../../context/JobsContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Company logos come back as either a relative path to our own uploads
// folder ("/uploads/xxx.png" — needs the backend origin prefixed) or an
// already-absolute URL (a Google/GitHub OAuth avatar) — leave those as-is.
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

// Falls back to the emoji placeholder if the logo URL 404s or the file
// is otherwise unreachable, instead of showing the browser's broken-image icon.
function CompanyLogo({ url, name, className }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <span className={className}>🏢</span>;
  return <img src={fileUrl(url)} alt={name} className={className} onError={() => setFailed(true)} />;
}

/* ==========================================================================
   ICONS
   ========================================================================== */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconBookmark = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

/* ==========================================================================
   HELPERS
   ========================================================================== */
function formatSalary(job) {
  const { salary } = job;
  if (!salary || (salary.min == null && salary.max == null)) return 'Competitive';
  const currency = salary.currency || 'INR';
  if (salary.min != null && salary.max != null) return `${currency} ${salary.min.toLocaleString()} – ${salary.max.toLocaleString()}`;
  return `${currency} ${(salary.min ?? salary.max).toLocaleString()}+`;
}

function formatLocation(job) {
  if (job.workplaceType === 'Remote') return 'Remote';
  const parts = [job.city, job.state, job.country].filter(Boolean);
  return parts.length ? parts.join(', ') : (job.workplaceType || 'Location TBD');
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function deadlineLabel(job) {
  if (!job.applicationDeadline) return null;
  if (job.isExpired) return 'Applications closed';
  const days = Math.ceil((new Date(job.applicationDeadline) - Date.now()) / 86400000);
  if (days <= 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Closes in ${days}d`;
}

/* ==========================================================================
   COMPONENTS
   ========================================================================== */
function JobCard({ job, isAppliedTab, isBookmarked, toggleBookmark }) {
  const [showModal, setShowModal] = useState(false);

  const statusStyles = {
    Shortlisted: 'text-green-400 bg-green-500/10 border-green-500/20',
    'Under Review': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    Applied: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  const closeBadge = deadlineLabel(job);
  const applyDisabled = job.isExpired || job.hasApplied;

  return (
    <div className="job-card flex flex-col bg-[#0f172a]/60 border border-white/5 rounded-2xl p-5 hover:bg-[#151f38] hover:border-white/10 transition-all duration-300 shadow-lg group">

      {/* Top Row: Logo, Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner border border-white/5 overflow-hidden">
            <CompanyLogo url={job.company?.logoUrl} name={job.company?.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-sans text-[1.05rem] font-bold text-white tracking-wide">{job.title}</h3>
            <p className="font-sans text-[0.9rem] text-gray-400 font-medium">{job.company?.name}</p>
          </div>
        </div>
        {closeBadge && (
          <span className={`shrink-0 px-2.5 py-1 rounded-full font-sans text-[0.7rem] font-bold uppercase tracking-wide ${job.isExpired ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
            {closeBadge}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="font-sans text-[0.85rem] text-gray-400 leading-relaxed mb-4 flex-1">
        {job.jobSummary ? job.jobSummary.slice(0, 130) + (job.jobSummary.length > 130 ? '…' : '') : 'No summary provided.'}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(job.skills || []).slice(0, 5).map(tag => (
          <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 text-gray-300 font-sans text-[0.75rem] font-medium tracking-wide">
            {tag}
          </span>
        ))}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-[0.75rem] font-sans text-gray-400 font-medium">
        <div className="flex items-center gap-1.5"><IconMapPin /> {formatLocation(job)}</div>
        <div className="flex items-center gap-1.5"><IconClock /> {timeAgo(job.publishedAt)}</div>
        <div className="flex items-center gap-1.5"><IconUsers /> {job.applicantsCount || 0} applied</div>
      </div>

      {/* Bottom Row: Salary & Actions */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <span className="font-sans text-[0.95rem] font-bold text-cyan-400 tracking-wide drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
          {formatSalary(job)}
        </span>

        <div className="flex items-center gap-3">
          {isAppliedTab || job.hasApplied ? (
            <div className={`px-3 py-1.5 rounded-full font-sans text-[0.75rem] font-bold tracking-widest uppercase border ${statusStyles[job.myApplication?.status] || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}>
              Applied
            </div>
          ) : (
            <>
              <button
                onClick={() => toggleBookmark(job.id)}
                className={`p-2 rounded-lg transition-all ${isBookmarked ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                aria-label="Bookmark"
              >
                <IconBookmark filled={isBookmarked} />
              </button>
              <button
                onClick={() => setShowModal(true)}
                disabled={applyDisabled}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-sans text-[0.85rem] font-bold shadow-[0_4px_14px_rgba(34,211,238,0.3)] hover:shadow-[0_6px_20px_rgba(34,211,238,0.4)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {job.isExpired ? 'Closed' : 'Apply'}
              </button>
            </>
          )}
        </div>
      </div>
      <ApplicationModal isOpen={showModal} onClose={() => setShowModal(false)} jobId={job.id} />
    </div>
  );
}

/* ==========================================================================
   MAIN PAGE
   ========================================================================== */
export default function JobsPage() {
  const {
    browseJobs, browseLoading, browseError, searchOpenJobs, myApplications, fetchMyApplications,
    bookmarkedIds, bookmarkedJobs, bookmarkedLoading, fetchBookmarkedJobs, toggleBookmark,
  } = useJobs();
  const [activeTab, setActiveTab] = useState('matched'); // 'matched', 'applications', 'bookmarked'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // toggleBookmark now persists to the backend (see JobsContext) instead
  // of only updating component state, so it survives a refresh.
  const handleToggleBookmark = (id) => {
    toggleBookmark(id).catch(() => {
      // Bookmarking failed server-side (network blip, job removed, etc.)
      // — nothing to roll back since we never optimistically flipped
      // local state; the button just stays as it was.
    });
  };

  // Initial load
  useEffect(() => {
    searchOpenJobs();
    fetchMyApplications();
    fetchBookmarkedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server-side search whenever the query or type filter changes
  useEffect(() => {
    const filters = {
      q: searchQuery,
      employmentType: activeFilter === 'Full-time' || activeFilter === 'Contract' ? activeFilter : undefined,
      workplaceType: activeFilter === 'Remote' ? 'Remote' : undefined,
    };
    const handle = setTimeout(() => searchOpenJobs(filters), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilter]);

  // The Bookmarked tab shows the candidate's full bookmarked-job list
  // (fetched independently) rather than filtering browseJobs by id —
  // a bookmarked job should still show up here even if it's since
  // fallen outside the current search/filter, or off the first page
  // of results.
  const jobsForTab =
    activeTab === 'applications' ? myApplications :
    activeTab === 'bookmarked'   ? bookmarkedJobs  :
    browseJobs;

  const filteredJobs = useMemo(() => {
    if (activeTab !== 'bookmarked') return jobsForTab;
    // Client-side filter for the bookmarked tab, since it isn't backed
    // by the server-side search endpoint like "Browse jobs" is.
    const q = searchQuery.trim().toLowerCase();
    return jobsForTab.filter((job) => {
      if (q && !`${job.title} ${job.companyName || ''}`.toLowerCase().includes(q)) return false;
      if (activeFilter === 'Full-time' && job.employmentType !== 'Full-time') return false;
      if (activeFilter === 'Contract' && job.employmentType !== 'Contract') return false;
      if (activeFilter === 'Remote' && job.workplaceType !== 'Remote') return false;
      return true;
    });
  }, [jobsForTab, activeTab, searchQuery, activeFilter]);

  const appliedCount = myApplications.length;
  const bookmarkedCount = bookmarkedIds.size;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative mt-5">

      {/* Header & Tabs */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans flex items-center gap-2 tracking-tight leading-tight mb-2">
          Opportunity Hub
        </h1>
        <p className="job-subtitle font-sans text-[0.9rem] text-gray-400 mb-4 tracking-wide">Search open roles and apply with your SkillSphere profile.</p>

        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-1">
          <button
            onClick={() => setActiveTab('matched')}
            className={`px-4 py-2 font-sans text-[0.9rem] font-semibold transition-all ${activeTab === 'matched' ? 'text-white border-b-2 border-indigo-400 bg-white/5 rounded-t-lg' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Browse jobs
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 font-sans text-[0.9rem] font-semibold transition-all ${activeTab === 'applications' ? 'text-white border-b-2 border-indigo-400 bg-white/5 rounded-t-lg' : 'text-gray-400 hover:text-gray-200'}`}
          >
            My applications ({appliedCount})
          </button>
          <button
            onClick={() => setActiveTab('bookmarked')}
            className={`px-4 py-2 font-sans text-[0.9rem] font-semibold transition-all ${activeTab === 'bookmarked' ? 'text-white border-b-2 border-indigo-400 bg-white/5 rounded-t-lg' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Bookmarked ({bookmarkedCount})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab !== 'applications' && (
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Search by role, department or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="job-search-input w-full bg-[#0f172a]/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[0.95rem] text-white font-sans focus:outline-none focus:border-indigo-500/50 focus:bg-[#0f172a]/80 transition-all shadow-inner placeholder:text-gray-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            {[
              { name: 'All', active: 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]', inactive: 'bg-transparent text-gray-400 hover:bg-indigo-500/10 hover:text-indigo-400' },
              { name: 'Full-time', active: 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]', inactive: 'bg-transparent text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400' },
              { name: 'Remote', active: 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]', inactive: 'bg-transparent text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400' },
              { name: 'Contract', active: 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]', inactive: 'bg-transparent text-gray-400 hover:bg-orange-500/10 hover:text-orange-400' }
            ].map(filter => (
              <button
                key={filter.name}
                onClick={() => setActiveFilter(filter.name)}
                className={`shrink-0 px-4 py-1.5 rounded-full font-sans text-[0.8rem] font-bold transition-all ${activeFilter === filter.name ? filter.active : filter.inactive}`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Job Grid */}
      {browseError && activeTab !== 'applications' && (
        <div className="mb-4 text-[0.85rem] font-sans text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {browseError}
        </div>
      )}

      {(browseLoading || (activeTab === 'bookmarked' && bookmarkedLoading)) && filteredJobs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400 font-sans text-sm">Loading jobs…</div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isAppliedTab={activeTab === 'applications'}
              isBookmarked={bookmarkedIds.has(job.id)}
              toggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4">
            <IconSearch />
          </div>
          <h3 className="font-sans text-lg font-semibold text-white mb-1">No jobs found</h3>
          <p className="font-sans text-[0.9rem] text-gray-400">Try adjusting your filters or search query.</p>
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0f172a] border border-[#22d3ee]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform z-50 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]">
        <div className="scale-125">
          <LogoMark />
        </div>
      </button>

    </div>
  );
}
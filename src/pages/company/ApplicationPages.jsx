import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { getMyJobs, getJobApplicants, getApplicantProfile, updateApplicantStatus } from '../../services/api';

/* ─── Inline SVG icons ─── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconChevronDown = ({ className = '' }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconChevronRight = ({ className = '' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconMoreVertical = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
);
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
);
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" fill="none" stroke="none"/><path d="M22 6c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6z"/><polyline points="22 6 12 13 2 6"/></svg>
);
const IconGraduationCap = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IconRocket = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const IconWrench = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IconAward = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
const IconTrophy = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const IconHeart = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconBookOpen = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconStar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

/* ─── Helpers ─── */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

// Same fix as ProfilePage.jsx: candidates may save "linkedin.com/in/x"
// without a scheme, which the browser would otherwise resolve as relative.
const externalUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const JOB_STATUS_META = {
  active: { label: 'Active', className: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  draft:  { label: 'Draft',  className: 'text-[var(--text-muted)] bg-gray-500/10 border-gray-500/20' },
  closed: { label: 'Closed', className: 'text-red-600 dark:text-red-300 bg-red-500/10 border-red-500/20' },
};

const ROUND_ORDER = ['new', 'reviewed', 'shortlisted', 'interview', 'hired'];
const ROUND_META = {
  new:         { label: 'New',                 className: 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/20' },
  reviewed:    { label: 'Reviewed',             className: 'text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
  shortlisted: { label: 'Shortlisted',          className: 'text-purple-600 dark:text-purple-300 bg-purple-500/10 border-purple-500/20' },
  interview:   { label: 'Interview Scheduled',  className: 'text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/20' },
  hired:       { label: 'Hired',                className: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  rejected:    { label: 'Rejected',             className: 'text-red-600 dark:text-red-300 bg-red-500/10 border-red-500/20' },
};

/* ══════════════════════════════════════════════════
   STATUS FILTER DROPDOWN
   Custom (non-native) select so the open list renders with the
   app's own theme instead of the browser's native popup — same
   portal + fixed-position pattern used elsewhere (e.g. PostJobPage),
   needed because this trigger sits inside a card-glass panel whose
   backdrop-filter creates a stacking context that would otherwise
   clip or bury an absolutely-positioned dropdown.
══════════════════════════════════════════════════ */
function StatusFilterSelect({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Anchors the panel to the trigger's *actual on-screen* rect every time,
  // then clamps it inside the viewport — without this a trigger sitting
  // near the right edge (as this one does, after a flex-1 search box)
  // combined with the panel's own min-width can push it straight past
  // the right edge of the screen instead of staying under the button.
  const computeCoords = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 200);
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const estimatedHeight = Math.min(options.length * 42 + 16, 280);

    let left = rect.left;
    if (left + width > viewportW - 8) left = rect.right - width; // right-align to the trigger instead
    left = Math.max(8, Math.min(left, viewportW - width - 8));

    const openUpward = rect.bottom + estimatedHeight > viewportH && rect.top > estimatedHeight;
    const top = openUpward ? rect.top - 6 : rect.bottom + 6;

    setCoords({ top, left, width, openUpward });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeCoords();
    // Guards against layouts where the trigger is still settling (page-
    // transition/sidebar animations) when the dropdown first opens.
    const raf = requestAnimationFrame(computeCoords);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, computeCoords]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    const handleReposition = () => computeCoords();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, computeCoords]);

  const current = options.find((o) => o.value === value);

  const dropdown = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: coords.openUpward ? undefined : coords.top,
        bottom: coords.openUpward ? window.innerHeight - coords.top : undefined,
        left: coords.left,
        width: coords.width,
      }}
      className="z-[1000] rounded-xl border border-[var(--border-card)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden py-1.5"
    >
      <ul className="max-h-64 overflow-y-auto">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <li
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`flex items-center gap-2 px-3.5 py-2.5 cursor-pointer font-sans text-[0.8rem] transition-colors ${selected ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-semibold' : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'}`}
            >
              {opt.dotClassName && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClassName}`} />}
              <span className="flex-1 truncate">{opt.label}</span>
              {selected && <span className="text-cyan-600 dark:text-cyan-300 shrink-0"><IconCheck /></span>}
            </li>
          );
        })}
      </ul>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={triggerRef} className="relative w-[190px] shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 w-full bg-[var(--card-inner-bg)] hover:bg-[var(--bg-card-hover)] border rounded-lg px-3 py-2 font-sans text-[0.8rem] text-[var(--text-primary)] outline-none transition-all ${isOpen ? 'border-cyan-500/40 ring-2 ring-cyan-500/20' : 'border-[var(--border-card)]'}`}
      >
        {current?.dotClassName && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotClassName}`} />}
        <span className="flex-1 truncate text-left">{current?.label || 'All Status'}</span>
        <IconChevronDown className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function ApplicationsPage() {
  const navigate = useNavigate();

  const [jobs, setJobs]               = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobSearch, setJobSearch]     = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [jobDetail, setJobDetail]           = useState(null);
  const [applicants, setApplicants]         = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantSearch, setApplicantSearch]     = useState('');
  const [statusFilter, setStatusFilter]           = useState('all');

  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [menuOpenId, setMenuOpenId]           = useState(null);
  const [detailApplicant, setDetailApplicant] = useState(null);

  /* ── Load the company's own job postings ── */
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyJobs();
        setJobs(data || []);
        if (data?.length) setSelectedJobId(data[0].id);
      } catch {
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    })();
  }, []);

  /* ── Load applicants whenever the selected job changes ── */
  const loadApplicants = useCallback(async (jobId) => {
    if (!jobId) { setJobDetail(null); setApplicants([]); return; }
    setApplicantsLoading(true);
    try {
      const { job, applicants: list } = await getJobApplicants(jobId);
      setJobDetail(job);
      setApplicants(list || []);
    } catch {
      setJobDetail(null);
      setApplicants([]);
    } finally {
      setApplicantsLoading(false);
    }
  }, []);

  useEffect(() => { loadApplicants(selectedJobId); }, [selectedJobId, loadApplicants]);

  /* ── Move an applicant to a new pipeline stage (optimistic) ── */
  const handleStatusChange = async (candidateId, status) => {
    setApplicants((prev) => prev.map((a) => (a.candidateId === candidateId ? { ...a, status } : a)));
    setMenuOpenId(null);
    try {
      await updateApplicantStatus(selectedJobId, candidateId, status);
    } catch {
      // Revert to server truth if the update didn't actually go through.
      loadApplicants(selectedJobId);
    }
  };

  const filteredJobs = jobs.filter(
    (j) => !jobSearch.trim() || (j.title || '').toLowerCase().includes(jobSearch.trim().toLowerCase())
  );

  const filteredApplicants = applicants.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    const q = applicantSearch.trim().toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full p-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">Applications</h1>
          <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] mt-1">Manage your job postings and view applicants</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/company-profile"
            className="font-sans text-[0.82rem] font-semibold text-[var(--text-secondary)] border border-[var(--border-card)] rounded-lg px-4 py-2.5 hover:bg-[var(--bg-card-hover)] no-underline transition-colors"
          >
            View Company Page
          </Link>
          <button
            onClick={() => navigate('/postings')}
            className="flex items-center gap-2 font-sans text-[0.82rem] font-semibold text-white rounded-lg px-4 py-2.5 transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.28)' }}
          >
            <IconPlus /> Post a New Job
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* ── Left: All Jobs ── */}
        <div className="w-[300px] shrink-0 card-glass rounded-2xl p-4 flex flex-col overflow-hidden">
          <h3 className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)] mb-3 px-1">All Jobs ({jobs.length})</h3>

          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><IconSearch /></span>
            <input
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] rounded-lg pl-9 pr-3 py-2 font-sans text-[0.8rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-cyan-500/40"
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1 -mx-1 px-1">
            {jobsLoading ? (
              <div className="text-[var(--text-muted)] font-sans text-[0.8rem] text-center py-6">Loading jobs…</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-[var(--text-muted)] font-sans text-[0.8rem] text-center py-6">
                {jobs.length === 0 ? 'No jobs posted yet.' : 'No jobs match your search.'}
              </div>
            ) : (
              filteredJobs.map((j) => {
                const meta = JOB_STATUS_META[j.status] || JOB_STATUS_META.draft;
                const active = j.id === selectedJobId;
                return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJobId(j.id)}
                    className={`text-left rounded-xl p-3 transition-all border ${active ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-transparent border-transparent hover:bg-[var(--bg-card-hover)]'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-sans text-[0.65rem] font-bold uppercase border ${meta.className}`}>{meta.label}</span>
                      <IconChevronRight className={active ? 'text-cyan-600 dark:text-cyan-400' : 'text-[var(--text-muted)]'} />
                    </div>
                    <div className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)] truncate">{j.title || 'Untitled role'}</div>
                    <div className="font-sans text-[0.72rem] text-[var(--text-secondary)] mt-0.5">{j.employmentType} • {j.workplaceType}</div>
                    <div className="font-sans text-[0.72rem] text-[var(--text-muted)] mt-1.5">
                      Applied: {j.applicantsCount || 0}
                      {j.status === 'closed'
                        ? ` · Closed on ${fmtDate(j.updatedAt)}`
                        : j.publishedAt ? ` · Posted on ${fmtDate(j.publishedAt)}` : ''}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Job detail + applicant table ── */}
        <div className="flex-1 card-glass rounded-2xl p-6 flex flex-col overflow-hidden min-w-0">
          {!jobDetail ? (
            <div className="flex items-center justify-center flex-1 text-[var(--text-muted)] font-sans text-[0.9rem] text-center px-6">
              {jobsLoading
                ? 'Loading…'
                : jobs.length === 0
                  ? 'Post a job to start receiving applications.'
                  : 'Select a job from the left to view its applicants.'}
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-sans text-[1.15rem] font-bold text-[var(--text-primary)]">{jobDetail.title}</h2>
                    {(() => {
                      const m = JOB_STATUS_META[jobDetail.status] || JOB_STATUS_META.draft;
                      return <span className={`px-2 py-0.5 rounded-full font-sans text-[0.65rem] font-bold uppercase border ${m.className}`}>{m.label}</span>;
                    })()}
                  </div>
                  <div className="flex items-center gap-4 mt-2 font-sans text-[0.78rem] text-[var(--text-secondary)] flex-wrap">
                    <span className="flex items-center gap-1.5"><IconBriefcase /> {jobDetail.employmentType}</span>
                    <span className="flex items-center gap-1.5"><IconMapPin /> {jobDetail.workplaceType}</span>
                    <span className="flex items-center gap-1.5"><IconCalendar /> Posted on {fmtDate(jobDetail.publishedAt)}</span>
                    <span className="flex items-center gap-1.5"><IconUsers /> {jobDetail.applicantsCount || 0} Applicants</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/postings', { state: { editId: jobDetail.id } })}
                  className="flex items-center gap-2 font-sans text-[0.8rem] font-semibold text-[var(--text-secondary)] border border-[var(--border-card)] rounded-lg px-3.5 py-2 hover:bg-[var(--bg-card-hover)] shrink-0"
                >
                  <IconEdit /> Edit Job
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><IconSearch /></span>
                  <input
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    placeholder="Search applicants..."
                    className="w-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] rounded-lg pl-9 pr-3 py-2 font-sans text-[0.8rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-cyan-500/40"
                  />
                </div>
                <StatusFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    ...Object.entries(ROUND_META).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                      dotClassName: k === 'rejected' ? 'bg-red-400' : k === 'hired' ? 'bg-emerald-400' : k === 'interview' ? 'bg-amber-400' : k === 'shortlisted' ? 'bg-purple-400' : k === 'reviewed' ? 'bg-indigo-400' : 'bg-cyan-400',
                    })),
                  ]}
                />
              </div>

              {/* Applicant table */}
              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left font-sans text-[0.68rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-card)]">
                      <th className="pb-3 pr-4 font-medium">Applicant</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Applied On</th>
                      <th className="pb-3 pr-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicantsLoading ? (
                      <tr><td colSpan={4} className="py-8 text-center text-[var(--text-muted)] font-sans text-[0.85rem]">Loading applicants…</td></tr>
                    ) : filteredApplicants.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-[var(--text-muted)] font-sans text-[0.85rem]">
                        {applicants.length === 0 ? 'No one has applied yet.' : 'No applicants match this filter.'}
                      </td></tr>
                    ) : (
                      filteredApplicants.map((a) => {
                        const meta = ROUND_META[a.status] || ROUND_META.new;
                        const expanded = expandedEmailId === a.candidateId;
                        return (
                          <tr key={a.candidateId} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  {expanded && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpandedEmailId(null); }}
                                      className="absolute -top-1.5 -left-1.5 z-10 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center leading-none"
                                      aria-label="Close"
                                    >
                                      <IconX />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setExpandedEmailId(expanded ? null : a.candidateId)}
                                    className="block w-9 h-9 rounded-full overflow-hidden bg-[var(--card-inner-bg)] border border-[var(--border-card)]"
                                    aria-label="Toggle email"
                                  >
                                    {a.photoURL ? (
                                      <img src={fileUrl(a.photoURL)} alt={a.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span
                                        className="flex items-center justify-center w-full h-full text-white font-sans text-[0.75rem] font-bold"
                                        style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
                                      >
                                        {initials(a.name)}
                                      </span>
                                    )}
                                  </button>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  {expanded ? (
                                    <span className="font-sans text-[0.82rem] font-medium text-cyan-600 dark:text-cyan-300 truncate">{a.email || 'No email on file'}</span>
                                  ) : (
                                    <>
                                      <span className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)] truncate">{a.name}</span>
                                      <span className="font-sans text-[0.72rem] text-[var(--text-muted)] truncate">{a.email}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`px-2.5 py-1 rounded-full font-sans text-[0.68rem] font-bold uppercase border whitespace-nowrap ${meta.className}`}>{meta.label}</span>
                            </td>
                            <td className="py-3 pr-4 font-sans text-[0.8rem] text-[var(--text-secondary)] whitespace-nowrap">{fmtDate(a.appliedAt)}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center justify-end gap-1 relative">
                                <button onClick={() => setDetailApplicant(a)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-[var(--bg-card-hover)]" aria-label="View details">
                                  <IconEye />
                                </button>
                                <button
                                  onClick={() => setMenuOpenId(menuOpenId === a.candidateId ? null : a.candidateId)}
                                  className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                                  aria-label="More actions"
                                >
                                  <IconMoreVertical />
                                </button>
                                {menuOpenId === a.candidateId && (
                                  <RoundMenu
                                    applicant={a}
                                    onChange={(status) => handleStatusChange(a.candidateId, status)}
                                    onClose={() => setMenuOpenId(null)}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {detailApplicant && (
        <ApplicantDetailModal
          applicant={detailApplicant}
          jobId={selectedJobId}
          onClose={() => setDetailApplicant(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROUND MENU (three-dot dropdown)
   Shows the full pipeline in order, lets the company jump the
   applicant to any stage, and always offers Reject separately.
══════════════════════════════════════════════════ */
function RoundMenu({ applicant, onChange, onClose }) {
  const rejected = applicant.status === 'rejected';
  const currentIdx = ROUND_ORDER.indexOf(applicant.status);

  return (
    <div
      className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-[var(--border-card)] bg-[var(--bg-panel)] shadow-2xl p-2"
      onMouseLeave={onClose}
    >
      <div className="font-sans text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide px-2 py-1.5">Hiring pipeline</div>
      {ROUND_ORDER.map((step, i) => {
        const meta = ROUND_META[step];
        const isCurrent = applicant.status === step;
        const passed = currentIdx > i && !rejected;
        return (
          <button
            key={step}
            onClick={() => onChange(step)}
            className={`w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg font-sans text-[0.8rem] transition-colors ${isCurrent ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-cyan-400' : passed ? 'bg-emerald-400' : 'bg-[var(--border-hover)]'}`} />
            {meta.label}
            {isCurrent && <span className="ml-auto text-[0.62rem] text-cyan-600 dark:text-cyan-400 font-semibold">Current</span>}
          </button>
        );
      })}
      <div className="h-px bg-[var(--border-subtle)] my-1.5" />
      <button
        onClick={() => onChange('rejected')}
        disabled={rejected}
        className="w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg font-sans text-[0.8rem] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <IconX /> {rejected ? 'Already rejected' : 'Reject application'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   APPLICANT DETAIL MODAL (eye icon)
   Resume upload -> direct download link.
   Shared profile -> lazy-fetched summary shown inline.
══════════════════════════════════════════════════ */
function ApplicantDetailModal({ applicant, jobId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    if (applicant.resumeSource !== 'profile') return;
    let cancelled = false;
    setLoadingProfile(true);
    getApplicantProfile(jobId, applicant.candidateId)
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch(() => { if (!cancelled) setProfileError(true); })
      .finally(() => { if (!cancelled) setLoadingProfile(false); });
    return () => { cancelled = true; };
  }, [applicant, jobId]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] max-h-[88vh] flex flex-col rounded-2xl border border-[var(--border-card)] bg-[var(--bg-panel)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--card-inner-bg)] border border-[var(--border-card)] shrink-0">
              {applicant.photoURL ? (
                <img src={fileUrl(applicant.photoURL)} alt={applicant.name} className="w-full h-full object-cover" />
              ) : (
                <span
                  className="flex items-center justify-center w-full h-full text-white font-sans font-bold"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
                >
                  {initials(applicant.name)}
                </span>
              )}
            </div>
            <div>
              <div className="font-sans text-[1.05rem] font-bold text-[var(--text-primary)]">{applicant.name}</div>
              <div className="font-sans text-[0.8rem] text-[var(--text-secondary)] flex items-center gap-1.5"><IconMail /> {applicant.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]" aria-label="Close">
            <IconX />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <DetailField label="Phone" value={applicant.phone || '—'} />
          <DetailField label="Open to relocate" value={applicant.relocate === 'yes' ? 'Yes' : applicant.relocate === 'no' ? 'No' : '—'} />
          <DetailField label="Notice period" value={applicant.noticePeriod || '—'} />
          <DetailField label="Top choice" value={applicant.topChoice ? 'Yes' : 'No'} />
          <DetailField label="Following company" value={applicant.followCompany ? 'Yes' : 'No'} />
          <DetailField label="Applied on" value={fmtDate(applicant.appliedAt)} />
        </div>

        {applicant.pitch && (
          <div className="mb-5">
            <div className="font-sans text-[0.68rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Cover note</div>
            <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{applicant.pitch}</p>
          </div>
        )}

        <div>
          <div className="font-sans text-[0.68rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Resume</div>

          {applicant.resumeSource === 'upload' ? (
            <a
              href={fileUrl(applicant.resumeUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-sans text-[0.85rem] font-semibold text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 bg-cyan-500/10 rounded-lg px-4 py-2.5 no-underline hover:bg-cyan-500/15"
            >
              <IconDownload /> {applicant.resumeName || 'Download resume'}
            </a>
          ) : loadingProfile ? (
            <div className="font-sans text-[0.85rem] text-[var(--text-muted)]">Loading shared profile…</div>
          ) : profileError || !profile ? (
            <div className="font-sans text-[0.85rem] text-[var(--text-muted)]">Couldn't load the shared profile.</div>
          ) : (
            <CandidateProfileView profile={profile} />
          )}
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════
   CANDIDATE PROFILE VIEW (read-only)
   Renders every section a candidate can fill in on their own
   ProfilePage — personal, education, experience, projects, skills,
   certs, awards, leadership, volunteer, publications, achievements —
   so a company sees the same depth as SkillSphere shows the candidate.
   Sections with no data are simply skipped.
══════════════════════════════════════════════════ */
function CandidateProfileView({ profile }) {
  const p = profile.personal || {};
  const skillGroups = [
    ['Languages', profile.skills?.languages],
    ['Frameworks', profile.skills?.frameworks],
    ['Tools', profile.skills?.tools],
    ['Libraries', profile.skills?.libraries],
  ].filter(([, list]) => list?.length);

  return (
    <div className="flex flex-col gap-5">
      {/* Personal / contact */}
      <div className="rounded-xl border border-[var(--border-card)] p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-cyan-600 dark:text-cyan-400"><IconRocket /></span>
          <span className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)]">{p.title || 'SkillSphere profile'}</span>
        </div>
        {p.location && <div className="flex items-center gap-1.5 font-sans text-[0.78rem] text-[var(--text-secondary)] mb-2"><IconMapPin /> {p.location}</div>}
        {p.summary && <p className="font-sans text-[0.82rem] text-[var(--text-secondary)] leading-relaxed mb-2">{p.summary}</p>}
        {(p.linkedin || p.github || p.portfolio) && (
          <div className="flex items-center gap-3 mt-1">
            {p.linkedin && <a href={externalUrl(p.linkedin)} target="_blank" rel="noreferrer" className="font-sans text-[0.78rem] font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline">LinkedIn</a>}
            {p.github && <a href={externalUrl(p.github)} target="_blank" rel="noreferrer" className="font-sans text-[0.78rem] font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline">GitHub</a>}
            {p.portfolio && <a href={externalUrl(p.portfolio)} target="_blank" rel="noreferrer" className="font-sans text-[0.78rem] font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline">Portfolio</a>}
          </div>
        )}
      </div>

      {skillGroups.length > 0 && (
        <ProfileSection icon={<IconWrench />} title="Technical skills">
          <div className="flex flex-col gap-2">
            {skillGroups.map(([label, list]) => (
              <div key={label} className="flex flex-wrap items-center gap-1.5">
                <span className="font-sans text-[0.7rem] font-semibold text-[var(--text-muted)] mr-1">{label}:</span>
                {list.map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-[var(--card-inner-bg)] text-[var(--text-secondary)] font-sans text-[0.7rem]">{s}</span>)}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.experiences || []).length > 0 && (
        <ProfileSection icon={<IconBriefcase />} title="Experience">
          <div className="flex flex-col gap-3">
            {profile.experiences.map((e, i) => (
              <div key={i}>
                <div className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)]">{e.title}{e.company ? ` — ${e.company}` : ''}</div>
                <div className="font-sans text-[0.72rem] text-[var(--text-muted)]">
                  {[e.location, [e.startDate, e.current ? 'Present' : e.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
                </div>
                {e.responsibilities && <p className="font-sans text-[0.78rem] text-[var(--text-secondary)] leading-relaxed mt-1 whitespace-pre-wrap">{e.responsibilities}</p>}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.educations || []).length > 0 && (
        <ProfileSection icon={<IconGraduationCap />} title="Education">
          <div className="flex flex-col gap-3">
            {profile.educations.map((ed, i) => (
              <div key={i}>
                <div className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)]">{ed.institution}</div>
                <div className="font-sans text-[0.78rem] text-[var(--text-secondary)]">{[ed.degree, ed.field].filter(Boolean).join(', ')}</div>
                <div className="font-sans text-[0.72rem] text-[var(--text-muted)]">
                  {[[ed.startDate, ed.endDate].filter(Boolean).join(' – '), ed.gpa ? `GPA ${ed.gpa}` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.projects || []).length > 0 && (
        <ProfileSection icon={<IconRocket />} title="Projects">
          <div className="flex flex-col gap-3">
            {profile.projects.map((pr, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)]">{pr.name}</span>
                  {pr.repo && <a href={externalUrl(pr.repo)} target="_blank" rel="noreferrer" className="font-sans text-[0.72rem] font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline">Repo</a>}
                  {pr.live && <a href={externalUrl(pr.live)} target="_blank" rel="noreferrer" className="font-sans text-[0.72rem] font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline">Live</a>}
                </div>
                {pr.tech && <div className="font-sans text-[0.72rem] text-[var(--text-muted)]">{pr.tech}</div>}
                {pr.desc && <p className="font-sans text-[0.78rem] text-[var(--text-secondary)] leading-relaxed mt-1">{pr.desc}</p>}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.certs || []).length > 0 && (
        <ProfileSection icon={<IconAward />} title="Certifications">
          <div className="flex flex-col gap-2">
            {profile.certs.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-sans text-[0.82rem] font-semibold text-[var(--text-primary)]">{c.name}</span>
                  <span className="font-sans text-[0.75rem] text-[var(--text-muted)]">{c.org ? ` — ${c.org}` : ''}{c.issueDate ? ` · ${c.issueDate}` : ''}</span>
                </div>
                {(c.credUrl || c.certPdfUrl) && (
                  <a href={externalUrl(c.credUrl) || fileUrl(c.certPdfUrl)} target="_blank" rel="noreferrer" className="font-sans text-[0.72rem] font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline shrink-0">View</a>
                )}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.awards || []).length > 0 && (
        <ProfileSection icon={<IconTrophy />} title="Awards">
          <div className="flex flex-col gap-1.5">
            {profile.awards.map((a, i) => (
              <div key={i} className="font-sans text-[0.82rem] text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{a.name}</span>{a.org ? ` — ${a.org}` : ''}{a.year ? ` (${a.year})` : ''}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.leaders || []).length > 0 && (
        <ProfileSection icon={<IconUsers />} title="Leadership">
          <div className="flex flex-col gap-2">
            {profile.leaders.map((l, i) => (
              <div key={i}>
                <div className="font-sans text-[0.82rem] font-semibold text-[var(--text-primary)]">{l.position}{l.org ? ` — ${l.org}` : ''}</div>
                <div className="font-sans text-[0.72rem] text-[var(--text-muted)]">{l.duration}</div>
                {l.desc && <p className="font-sans text-[0.78rem] text-[var(--text-secondary)] leading-relaxed mt-0.5">{l.desc}</p>}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.volunteers || []).length > 0 && (
        <ProfileSection icon={<IconHeart />} title="Volunteer">
          <div className="flex flex-col gap-2">
            {profile.volunteers.map((v, i) => (
              <div key={i}>
                <div className="font-sans text-[0.82rem] font-semibold text-[var(--text-primary)]">{v.role}{v.org ? ` — ${v.org}` : ''}</div>
                <div className="font-sans text-[0.72rem] text-[var(--text-muted)]">{v.duration}</div>
                {v.desc && <p className="font-sans text-[0.78rem] text-[var(--text-secondary)] leading-relaxed mt-0.5">{v.desc}</p>}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.pubs || []).length > 0 && (
        <ProfileSection icon={<IconBookOpen />} title="Publications">
          <div className="flex flex-col gap-1.5">
            {profile.pubs.map((pub, i) => (
              <div key={i} className="font-sans text-[0.82rem] text-[var(--text-secondary)]">
                {pub.link ? (
                  <a href={externalUrl(pub.link)} target="_blank" rel="noreferrer" className="font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 no-underline">{pub.title}</a>
                ) : (
                  <span className="font-semibold text-[var(--text-primary)]">{pub.title}</span>
                )}
                {pub.conference ? ` — ${pub.conference}` : ''}{pub.year ? ` (${pub.year})` : ''}
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      {(profile.extras?.achievements || profile.extras?.interests?.length > 0) && (
        <ProfileSection icon={<IconStar />} title="Achievements & interests">
          {profile.extras.achievements && (
            <p className="font-sans text-[0.8rem] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap mb-2">{profile.extras.achievements}</p>
          )}
          {profile.extras.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.extras.interests.map((it) => <span key={it} className="px-2 py-0.5 rounded-md bg-[var(--card-inner-bg)] text-[var(--text-secondary)] font-sans text-[0.7rem]">{it}</span>)}
            </div>
          )}
        </ProfileSection>
      )}
    </div>
  );
}

function ProfileSection({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-cyan-600 dark:text-cyan-400">{icon}</span>
        <span className="font-sans text-[0.78rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div className="font-sans text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</div>
      <div className="font-sans text-[0.85rem] text-[var(--text-secondary)]">{value}</div>
    </div>
  );
}
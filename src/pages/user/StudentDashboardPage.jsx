import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../../components/shared/Topbar';
import { useRoadmap, PHASE_COLORS } from '../../context/RoadmapContext';
import { useJobs } from '../../context/JobsContext';
import { getPhaseIcon, LEVEL_TAG } from '../../utils/roadmapTransform';
import ApplicationModal from '../../components/modals/ApplicationModal';
import { getMe, getProfile, getRecommendedJobs, getGithubRepos, refreshGithubRepos } from '../../services/api';

/* ==========================================================================
   READINESS SCORE
   Your backend doesn't store a "career readiness" number anywhere, so
   this derives a simple 0–100 completeness score straight from the
   candidate's real profile data. Swap this out if you ever add a real
   scoring endpoint — everything downstream just expects a 0–100 int.
   ========================================================================== */
function computeReadiness(profile) {
  if (!profile) return 0;
  let score = 0;

  // Blank rows (added in the builder UI, then left empty) are still
  // valid array entries since nothing in these schemas is required —
  // count only ones with their primary field actually filled in.
  const nonEmpty = (arr, key) => (arr || []).filter(item => item?.[key]?.trim()).length;

  const p = profile.personal || {};
  if (p.fullName)  score += 8;
  if (p.title)     score += 6;
  if (p.summary)   score += 8;
  if (p.location)  score += 4;
  if (p.phone)     score += 4;
  if (p.linkedin || p.github || p.portfolio) score += 6;
  if (p.photoUrl)  score += 4;

  if (nonEmpty(profile.educations,  'institution')) score += 15;
  if (nonEmpty(profile.experiences, 'company'))     score += 15;
  if (nonEmpty(profile.projects,    'name'))        score += 10;

  const skillCount =
    (profile.skills?.languages  || []).filter(s => s?.trim()).length +
    (profile.skills?.frameworks || []).filter(s => s?.trim()).length +
    (profile.skills?.tools      || []).filter(s => s?.trim()).length +
    (profile.skills?.libraries  || []).filter(s => s?.trim()).length;
  score += Math.min(skillCount * 2, 12);

  if (nonEmpty(profile.certs, 'name')) score += 8;

  return Math.min(Math.round(score), 100);
}

/* ==========================================================================
   ICONS & CONSTANTS
   ========================================================================== */

const IconSparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconZap = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconBadge = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const IconFolder = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconGraduationCap = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const IconLocation = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconPeople = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconBookmark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

function buildSideStats({ verifiedSkills, activeApplications, certifications, skillCategoriesCovered }) {
  return [
    {
      icon: <IconZap />, value: String(verifiedSkills), label: 'Skills',
      caption: `${skillCategoriesCovered} of 4 categories`,
      color: '#22d3ee', bgFrom: 'rgba(6,182,212,0.18)', bgTo: 'rgba(6,182,212,0.05)', border: 'rgba(6,182,212,0.18)',
    },
    // Active applications will light up once the jobs/applications
    // backend + company-side pages are wired in.
    {
      icon: <IconBriefcase />, value: String(activeApplications), label: 'Active applications',
      caption: activeApplications > 0 ? 'In progress' : 'Explore jobs to apply',
      color: '#818cf8', bgFrom: 'rgba(99,102,241,0.18)', bgTo: 'rgba(99,102,241,0.05)', border: 'rgba(99,102,241,0.2)',
    },
    {
      icon: <IconBadge />, value: String(certifications), label: 'Certifications',
      caption: certifications > 0 ? 'Listed on your profile' : 'Add certs to your profile',
      color: '#38bdf8', bgFrom: 'rgba(59,130,246,0.18)', bgTo: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)',
    },
  ];
}

// Second row of stat cards — same shape as buildSideStats, just kept
// separate so the hero grid can lay row 1 (readiness + core stats) and
// row 2 (projects/education + skill mix chart) out independently.
function buildExtraStats({ projectsCount, educationCount }) {
  return [
    {
      icon: <IconFolder />, value: String(projectsCount), label: 'Projects',
      caption: projectsCount > 0 ? 'In your portfolio' : 'Add a project to your profile',
      color: '#a78bfa', bgFrom: 'rgba(167,139,250,0.18)', bgTo: 'rgba(167,139,250,0.05)', border: 'rgba(167,139,250,0.2)',
    },
    {
      icon: <IconGraduationCap />, value: String(educationCount), label: 'Education',
      caption: educationCount > 0 ? 'Institutions listed' : 'Add your education history',
      color: '#34d399', bgFrom: 'rgba(52,211,153,0.18)', bgTo: 'rgba(52,211,153,0.05)', border: 'rgba(52,211,153,0.2)',
    },
  ];
}

// PHASE_COLORS, LEVEL_TAG and the phase-icon mapping are shared from
// ../../utils/roadmapTransform / ../../context/RoadmapContext — see imports.

// Your profile schema stores skill names only (no per-skill proficiency
// score), so we cycle through this palette for whichever real skills
// come back from the API instead of inventing percentages.
const SKILL_COLORS = ['#06b6d4', '#22d3ee', '#6366f1', '#818cf8', '#3b82f6', '#0ea5e9'];

const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A10.53 10.53 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L21.5 9.1l-4.75 4.63L17.9 21 12 17.77 6.1 21l1.15-7.27L2.5 9.1l6.6-.84z"/></svg>
);
const IconForkSmall = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6 8.5v2A3.5 3.5 0 0 0 9.5 14H12M18 8.5v2A3.5 3.5 0 0 1 14.5 14H12m0 0v2"/></svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

/* Relative-time label for the GitHub cache's fetchedAt, e.g. "Synced 5m ago" */
const timeAgo = (iso) => {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

function SectionHeader({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.14))', border: '1px solid rgba(6,182,212,0.18)' }}
        >
          <span className="text-cyan-400 [&>svg]:w-[17px] [&>svg]:h-[17px]">{icon}</span>
        </div>
        <h3 className="font-sans text-[1.05rem] font-semibold text-white">{title}</h3>
      </div>
      {action}
    </div>
  );
}

/* ==========================================================================
   INLINED COMPONENTS
   ========================================================================== */

function WelcomeBanner({ userName = 'Aarav' }) {
  const navigate = useNavigate();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative overflow-hidden card-glass rounded-2xl p-6 sm:p-8">
      <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.16) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-24 -left-10 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)' }} />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex flex-col">
          <div
            className="inline-flex self-start items-center gap-2 font-sans text-[0.78rem] font-medium mb-3 px-3 py-1 rounded-full"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-card)' }}
          >
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)' }} />
            {getGreeting()} <span className="inline-block animate-[wave_2.5s_infinite] origin-[70%_70%] text-base">👋</span>
          </div>
          <div className="text-2xl sm:text-[2rem] font-extrabold text-white font-sans flex items-center gap-2 tracking-tight leading-tight">
            Welcome back,{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {userName}
            </span>
          </div>
          <p className="text-gray-400 text-[0.95rem] font-sans mt-2 font-medium">Here's your career intelligence snapshot for today.</p>
        </div>
        <div className="flex-shrink-0">
          <button
            className="inline-flex items-center gap-2 text-white font-semibold font-sans text-[0.9rem] py-2.5 px-4.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.28)' }}
            id="wb-explore-jobs"
            onClick={() => navigate('/jobs')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            Explore jobs
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroStatsPanel({ score, stats, extraStats = [], skillMix = [] }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 140;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = 58, lw = 10;
    const start = -Math.PI / 2;
    const end = start + (2 * Math.PI * score) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);

    const trackColor = getComputedStyle(document.documentElement).getPropertyValue('--border-card').trim() || 'rgba(148,163,184,0.25)';
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(1, '#818cf8');
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = grad;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(99,102,241,0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
  }, [score]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6 items-start">
      {/* Career readiness — its own card, not sharing a box with the stats */}
      <div className="relative overflow-hidden card-glass rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1 h-[230px] sm:h-[250px]">
        <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 70%)' }} />
        <span className="relative font-sans text-[0.72rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] mb-3">Career readiness</span>
        <div className="relative flex items-center justify-center">
          <canvas ref={canvasRef} className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-sans text-[1.55rem] sm:text-[1.75rem] font-extrabold text-[var(--text-primary)] leading-tight drop-shadow-[0_0_12px_rgba(99,102,241,0.3)]">{score}%</span>
            <span className="font-sans text-[0.62rem] font-medium text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Job-ready</span>
          </div>
        </div>
      </div>

      {/* Each stat gets its own equal-sized card so nothing has to stretch
          across dead space to fill the row */}
      {stats.map((s, i) => (
        <div
          key={i}
          className="relative overflow-hidden card-glass rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3 transition-transform duration-300 hover:-translate-y-0.5 h-[230px] sm:h-[250px]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ background: `radial-gradient(circle, ${s.color}26 0%, transparent 70%)` }} />
          <div
            className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] shrink-0"
            style={{ background: `linear-gradient(135deg, ${s.bgFrom}, ${s.bgTo})`, border: `1px solid ${s.border}`, color: s.color }}
          >
            {s.icon}
          </div>
          <div className="relative flex flex-col items-center">
            <span className="font-sans text-[1.5rem] sm:text-[1.65rem] font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</span>
            <span className="font-sans text-[0.78rem] font-medium text-[var(--text-muted)] leading-snug">{s.label}</span>
            {s.caption && (
              <span className="font-sans text-[0.68rem] font-medium text-[var(--text-muted)] opacity-70 mt-1.5">{s.caption}</span>
            )}
          </div>
        </div>
      ))}

      {/* Row 2 — projects / education counts, same card treatment as row 1 */}
      {extraStats.map((s, i) => (
        <div
          key={`extra-${i}`}
          className="relative overflow-hidden card-glass rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3 transition-transform duration-300 hover:-translate-y-0.5 h-[230px] sm:h-[250px]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ background: `radial-gradient(circle, ${s.color}26 0%, transparent 70%)` }} />
          <div
            className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] shrink-0"
            style={{ background: `linear-gradient(135deg, ${s.bgFrom}, ${s.bgTo})`, border: `1px solid ${s.border}`, color: s.color }}
          >
            {s.icon}
          </div>
          <div className="relative flex flex-col items-center">
            <span className="font-sans text-[1.5rem] sm:text-[1.65rem] font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</span>
            <span className="font-sans text-[0.78rem] font-medium text-[var(--text-muted)] leading-snug">{s.label}</span>
            {s.caption && (
              <span className="font-sans text-[0.68rem] font-medium text-[var(--text-muted)] opacity-70 mt-1.5">{s.caption}</span>
            )}
          </div>
        </div>
      ))}

      {/* Skill mix — real distribution across the 4 skill categories in the
          profile schema (languages/frameworks/tools/libraries), not a fake
          activity/tracking chart. Spans 2 cols so row 2 lines up with row 1. */}
      <div className="card-glass rounded-2xl p-5 sm:p-6 flex flex-col justify-center col-span-2 h-[230px] sm:h-[250px]">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.14))', border: '1px solid rgba(6,182,212,0.18)' }}
          >
            <span className="text-cyan-400 [&>svg]:w-[16px] [&>svg]:h-[16px]"><IconBarChart /></span>
          </div>
          <span className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)]">Skill mix</span>
        </div>

        {skillMix.every((s) => s.count === 0) ? (
          <p className="font-sans text-[0.8rem] text-[var(--text-muted)] text-center py-3">
            Add skills in your profile to see your mix.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {(() => {
              const maxCount = Math.max(...skillMix.map((s) => s.count), 1);
              return skillMix.map((s, i) => {
                const pct = Math.round((s.count / maxCount) * 100);
                const color = SKILL_COLORS[i % SKILL_COLORS.length];
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="font-sans text-[0.72rem] font-medium text-[var(--text-muted)] w-[76px] shrink-0">{s.label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-hover)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                      />
                    </div>
                    <span className="font-sans text-[0.75rem] font-semibold w-5 text-right shrink-0" style={{ color }}>{s.count}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/* Pulls the user's top 5 most-recently-pushed public repos via our own
   backend's /api/github/repos endpoint, which attaches a server-side
   GitHub token — see github.service.js. No username needs to be passed
   from here; the backend reads it off the signed-in user's own profile.

   Cache-first: the backend serves this from the DB after the first-ever
   fetch, so this normal load never spends a GitHub API call. The little
   refresh button is the only thing that forces a live re-fetch. */
function GithubReposCard() {
  const [state, setState] = useState({ loading: true, error: null, repos: [], fetchedAt: null });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { repos, reason, fetchedAt } = await getGithubRepos();
      if (!cancelled) setState({ loading: false, error: reason || null, repos: repos || [], fetchedAt: fetchedAt || null });
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    const { repos, reason, fetchedAt } = await refreshGithubRepos();
    if (reason) {
      // A rate-limit blip or a bad link shouldn't wipe out repos that
      // were displaying fine a second ago — just surface the message
      // and leave whatever was already on screen.
      setRefreshError(
        reason === 'no-username' ? 'Add your GitHub profile link in your profile first.' :
        reason === 'not-found'   ? "Couldn't find a GitHub account for that link." :
        "Couldn't refresh right now (GitHub may be rate-limiting)."
      );
    } else {
      setState({ loading: false, error: null, repos: repos || [], fetchedAt: fetchedAt || null });
    }
    setRefreshing(false);
  };

  const { loading, error, repos, fetchedAt } = state;

  const EmptyState = ({ children }) => (
    <div className="flex flex-col items-center text-center gap-2 py-8">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-1" style={{ background: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}>
        <IconGithub />
      </div>
      <p className="font-sans text-[0.85rem] text-[var(--text-muted)] max-w-[340px]">{children}</p>
    </div>
  );

  return (
    <div className="flex flex-col card-glass rounded-2xl p-5 mb-6">
      <style>{`
        @keyframes ghRepoIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <SectionHeader
        icon={<IconGithub />}
        title="GitHub repositories"
        action={
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title={fetchedAt ? `Last synced ${timeAgo(fetchedAt)}` : 'Fetch from GitHub'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={refreshing ? 'animate-spin' : ''}><IconRefresh /></span>
            <span className="font-sans text-[0.75rem] font-semibold hidden sm:inline">{refreshing ? 'Syncing…' : 'Refresh'}</span>
          </button>
        }
      />

      {!loading && fetchedAt && (
        <p className="font-sans text-[0.72rem] text-[var(--text-muted)] -mt-3 mb-3">Synced {timeAgo(fetchedAt)}</p>
      )}
      {refreshError && (
        <p className="font-sans text-[0.78rem] text-amber-400 -mt-1 mb-3">{refreshError}</p>
      )}

      {loading && (
        <p className="font-sans text-[0.85rem] text-[var(--text-muted)] text-center py-8">Loading repositories…</p>
      )}

      {!loading && error === 'no-username' && (
        <EmptyState>Add your GitHub profile link in your profile to show your repos here.</EmptyState>
      )}
      {!loading && error === 'not-found' && (
        <EmptyState>Couldn't find a GitHub account for that link — double check the URL in your profile.</EmptyState>
      )}
      {!loading && error === 'fetch-failed' && (
        <EmptyState>Couldn't load repositories right now (GitHub may be rate-limiting). Try again in a bit.</EmptyState>
      )}
      {!loading && !error && repos.length === 0 && (
        <EmptyState>No public repositories found on this GitHub account yet.</EmptyState>
      )}

      {!loading && !error && repos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo, i) => <RepoCard key={repo.id} repo={repo} index={i} />)}
        </div>
      )}
    </div>
  );
}

function RepoCard({ repo, index = 0 }) {
  const desc = repo.description
    ? (repo.description.length > 90 ? `${repo.description.slice(0, 90)}…` : repo.description)
    : null;

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group/repo flex flex-col gap-3 p-4 rounded-xl no-underline transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--bg-card-hover)',
        border: '1px solid var(--border-card)',
        animation: 'ghRepoIn 0.4s ease-out both',
        animationDelay: `${index * 80}ms`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(34,211,238,0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-transform duration-300 group-hover/repo:scale-110 group-hover/repo:text-cyan-400" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
          <IconGithub />
        </span>
        <span className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)] truncate">{repo.name}</span>
      </div>

      <p className="font-sans text-[0.8rem] text-[var(--text-muted)] leading-snug min-h-[2.4em]">
        {desc || 'No description provided.'}
      </p>

      {repo.langs?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.langs.map((l) => (
            <span key={l} className="font-sans text-[0.7rem] font-medium px-2 py-0.5 rounded-full" style={{ color: '#22d3ee', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.18)' }}>
              {l}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[var(--text-muted)] font-sans text-[0.75rem] mt-auto pt-1">
        <span className="flex items-center gap-1"><IconStar /> {repo.stargazers_count}</span>
        <span className="flex items-center gap-1"><IconForkSmall /> {repo.forks_count}</span>
      </div>
    </a>
  );
}

function SkillOverviewCard({ skills = [] }) {
  return (
    <div className="flex flex-col card-glass rounded-2xl p-5">
      <SectionHeader icon={<IconSparkle />} title="Skills" />
      {skills.length === 0 ? (
        <p className="font-sans text-[0.85rem] text-[var(--text-muted)] text-center max-w-[220px] py-6">
          No skills added yet — add some in your profile.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2.5 content-start">
          {skills.map((name, i) => {
            const color = SKILL_COLORS[i % SKILL_COLORS.length];
            return (
              <span
                key={name}
                className="flex items-center gap-2 font-sans text-[0.85rem] font-medium text-[var(--text-secondary)] pl-3 pr-3.5 py-1.5 rounded-full border transition-colors hover:text-[var(--text-primary)]"
                style={{ background: `${color}14`, borderColor: `${color}33` }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                {name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoadmapCard() {
  const navigate = useNavigate();
  const { phases, targetRole } = useRoadmap();

  // There's no backend model persisting roadmap progress yet — RoadmapContext
  // is just in-memory curriculum content, the same for every account. Using
  // a persisted flag (set the moment someone actually opens /roadmap) is a
  // stand-in "have they engaged with this yet" signal so the dashboard isn't
  // showing a fully-populated roadmap to someone who's never touched it.
  // Swap this for a real `hasStartedRoadmap` field from the backend once one
  // exists — everything below already renders conditionally off one boolean.
  const [hasStarted, setHasStarted] = useState(
    () => localStorage.getItem('ss_roadmap_started') === 'true'
  );

  const openRoadmap = () => {
    localStorage.setItem('ss_roadmap_started', 'true');
    navigate('/roadmap');
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center text-center gap-3 w-full card-glass rounded-2xl p-8">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.14))', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <h3 className="font-sans text-[1rem] font-semibold text-[var(--text-primary)] mt-1">No career roadmap yet</h3>
        <p className="font-sans text-[0.85rem] text-[var(--text-muted)] max-w-[360px]">
          Set a target role and we'll lay out the phases to get you there.
        </p>
        <button
          onClick={openRoadmap}
          className="mt-2 flex items-center gap-2 font-sans text-[0.85rem] font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.28)' }}
        >
          Build my roadmap
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full card-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-[10px] shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.14))', border: '1px solid rgba(6,182,212,0.18)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div>
            <h3 className="font-sans text-[0.95rem] font-semibold text-[var(--text-primary)]">Career roadmap</h3>
            <p className="font-sans text-[0.75rem] text-[var(--text-muted)] mt-0.5">Target: <span className="text-[var(--text-primary)] font-medium">{targetRole}</span></p>
          </div>
        </div>
        <button className="bg-transparent border border-[var(--border-card)] rounded text-[var(--text-secondary)] font-sans text-[0.75rem] font-semibold uppercase px-3 py-1.5 cursor-pointer hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all" onClick={() => navigate('/roadmap')}>Open</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
        {phases.map((p) => {
          const colors = PHASE_COLORS[p.color] || PHASE_COLORS.blue;
          const levelTag = LEVEL_TAG[p.level] || p.level;
          return (
          <div
            key={p.id}
            className="group/card relative w-full h-[240px] rounded-xl overflow-hidden transition-all duration-300 dashboard-preview-card"
            style={{ border: `1px solid ${colors.border}`, background: colors.bg, boxShadow: `0 0 0 rgba(0,0,0,0)` }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px ${colors.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; }}
          >
            {/* Front side */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center gap-3 p-4 transition-opacity duration-300 group-hover/card:opacity-0">
              <div className="p-3 rounded-2xl mb-1" style={{ background: colors.bg, color: colors.text }}>
                {getPhaseIcon(p.icon)}
              </div>
              <span
                className="font-sans text-[0.85rem] font-extrabold uppercase px-4 py-1.5 rounded-lg tracking-widest shadow-sm"
                style={{ background: colors.bg, color: colors.text }}
              >
                Phase {p.id}
              </span>
              <p className="font-sans text-[1.1rem] font-bold text-[var(--text-heading)] tracking-wide leading-tight">{p.title}</p>
            </div>
            {/* Overlay side (Slides up on hover) */}
            <div className="absolute inset-0 flex flex-col justify-center items-start p-4 bg-[var(--bg-card)] transition-all duration-300 translate-y-full opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100">
              <h4 className="font-sans text-[1rem] font-bold text-[var(--text-heading)] mb-3 tracking-wide">{p.title}</h4>
              <ul className="flex flex-col gap-3 w-full">
                {(p.topics || []).slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full mt-0.5" style={{ background: colors.bg, color: colors.text }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </span>
                    <span className="font-sans text-[0.9rem] text-[var(--text-body)] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-sans text-[0.7rem] font-semibold flex items-center gap-1" style={{ color: colors.text }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-0.5" style={{ background: colors.text }}></span>
                {levelTag}
              </p>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

function MatchRing({ pct, color }) {
  const r = 18, circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative w-12 h-12 shrink-0 ml-auto flex items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border-card)" strokeWidth="3.5"/>
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 24 24)"/>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-sans text-[0.7rem] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

// Falls back to the emoji placeholder if the logo URL 404s or is
// otherwise unreachable, instead of showing the browser's broken-image icon.
function CompanyLogo({ url, name, className }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <span className={className}>🏢</span>;
  return <img src={fileUrl(url)} alt={name} className={className} onError={() => setFailed(true)} />;
}

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

function deadlineLabel(job) {
  if (!job.applicationDeadline) return null;
  if (job.isExpired) return 'Applications closed';
  const days = Math.ceil((new Date(job.applicationDeadline) - Date.now()) / 86400000);
  if (days <= 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Closes in ${days}d`;
}

function JobCard({ job }) {
  const [showModal, setShowModal] = useState(false);
  const closeBadge = deadlineLabel(job);
  return (
    <>
      <div className="job-card flex flex-col bg-[#0f172a]/60 border border-white/5 rounded-2xl p-5 hover:bg-[#151f38] hover:border-white/10 transition-all duration-300 shadow-lg group">

        {/* Top Row: Logo, Title, Deadline badge */}
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
          <div className="flex items-center gap-1.5"><IconLocation /> {formatLocation(job)}</div>
          <div className="flex items-center gap-1.5"><IconClock /> {timeAgo(job.publishedAt) || 'Recently'}</div>
          <div className="flex items-center gap-1.5"><IconPeople /> {job.applicantsCount || 0} applied</div>
        </div>

        {/* Bottom Row: Salary & Actions */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <span className="font-sans text-[0.95rem] font-bold text-cyan-400 tracking-wide drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
            {formatSalary(job)}
          </span>

          <div className="flex items-center gap-3">
            {job.hasApplied ? (
              <div className="px-3 py-1.5 rounded-full font-sans text-[0.75rem] font-bold tracking-widest uppercase border text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
                Applied
              </div>
            ) : (
              <>
                <button
                  className="p-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-white/5"
                  aria-label="Bookmark"
                >
                  <IconBookmark />
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  disabled={job.isExpired}
                  className="font-sans text-[0.85rem] font-semibold text-white rounded-lg px-4 py-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.28)' }}
                >
                  Apply
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <ApplicationModal isOpen={showModal} onClose={() => setShowModal(false)} jobId={job.id} />
    </>
  );
}

function RecommendedJobsRow() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getRecommendedJobs();
      if (!cancelled) { setJobs(result); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col w-full card-glass rounded-2xl p-6 mt-6 mb-10">
      <SectionHeader
        icon={<IconBriefcase />}
        title="Recommended for you"
        action={
          <button
            className="bg-transparent border-none text-cyan-400 font-sans text-[0.8rem] font-semibold uppercase cursor-pointer hover:text-cyan-300"
            onClick={() => navigate('/jobs')}
          >
            See all jobs
          </button>
        }
      />

      {!loading && jobs.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 rounded-xl p-10" style={{ border: '1px solid var(--border-card)' }}>
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.14))', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}
          >
            <IconBriefcase />
          </div>
          <h4 className="font-sans text-[1rem] font-semibold text-white mt-1">No recommendations yet</h4>
          <p className="font-sans text-[0.85rem] text-gray-400 max-w-[380px]">
            Once companies start posting roles that match your profile, they'll show up here automatically.
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-2 font-sans text-[0.85rem] font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.28)' }}
          >
            Browse all jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   MAIN PAGE EXPORT
   ========================================================================== */

export default function StudentDashboardPage() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { myApplications, fetchMyApplications } = useJobs();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [meRes, profileRes] = await Promise.all([getMe(), getProfile()]);
        if (cancelled) return;
        setUser(meRes);
        setProfile(profileRes);
      } catch (err) {
        console.error('[Dashboard] failed to load user/profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Dashboard mounts independently of the Jobs page, so it needs its own
  // fetch to know how many applications the candidate actually has —
  // without this the "Active applications" stat never leaves its 0
  // placeholder even after applying.
  useEffect(() => { fetchMyApplications(); }, [fetchMyApplications]);

  const userName = user?.displayName || 'there';

  // Skills are plain strings in the schema, so filter out blank/whitespace
  // entries (can happen if a tag input was opened and left empty).
  const skillNames = profile ? [
    ...(profile.skills?.languages  || []),
    ...(profile.skills?.frameworks || []),
    ...(profile.skills?.tools      || []),
    ...(profile.skills?.libraries  || []),
  ].filter(s => s?.trim()).slice(0, 6) : [];

  const countNonEmpty = (arr) => (arr || []).filter(s => s?.trim()).length;
  const verifiedSkillsCount =
    countNonEmpty(profile?.skills?.languages) +
    countNonEmpty(profile?.skills?.frameworks) +
    countNonEmpty(profile?.skills?.tools) +
    countNonEmpty(profile?.skills?.libraries);

  // certs/educations/experiences/projects have no required fields, so an
  // "empty row" added and left blank in the builder is a valid array
  // entry — .length alone would count it. Only count entries that
  // actually have their primary field filled in.
  const certificationsCount = (profile?.certs || []).filter(c => c?.name?.trim()).length;
  const readiness = computeReadiness(profile);

  const skillMix = [
    { label: 'Languages', count: countNonEmpty(profile?.skills?.languages) },
    { label: 'Frameworks', count: countNonEmpty(profile?.skills?.frameworks) },
    { label: 'Tools', count: countNonEmpty(profile?.skills?.tools) },
    { label: 'Libraries', count: countNonEmpty(profile?.skills?.libraries) },
  ];
  const skillCategoriesCovered = skillMix.filter(s => s.count > 0).length;

  const stats = buildSideStats({
    verifiedSkills: verifiedSkillsCount,
    activeApplications: myApplications.length,
    certifications: certificationsCount,
    skillCategoriesCovered,
  });

  // Row 2 of the hero panel: projects/education counts, plus a real
  // per-category skill breakdown (no invented "activity" numbers).
  const projectsCount = (profile?.projects || []).filter(p => p?.name?.trim()).length;
  const educationCount = (profile?.educations || []).filter(e => e?.institution?.trim()).length;

  const extraStats = buildExtraStats({ projectsCount, educationCount });

  return (
    <div className="relative" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Ambient background blobs — matches the cyan/indigo/purple glow used
          across the profile builder and auth pages */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10), transparent 70%)', filter: 'blur(90px)', top: '-10%', left: '-5%' }}
        />
        <div
          className="absolute w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)', filter: 'blur(90px)', bottom: '-10%', right: '-5%' }}
        />
      </div>

      <div className={`relative z-10 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
        <WelcomeBanner userName={userName} />
        <HeroStatsPanel score={readiness} stats={stats} extraStats={extraStats} skillMix={skillMix} />

        <div className="mt-6">
          <GithubReposCard />
          <SkillOverviewCard skills={skillNames} />
        </div>

        <div className="mt-6">
          <RoadmapCard />
        </div>

        {/* RecommendedJobsRow now calls getRecommendedJobs() for real — it'll
            show actual matches automatically once /jobs/recommended exists
            on the backend, and an empty state until then. */}
        <RecommendedJobsRow />

        {/* Floating AI Button */}
        <button
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform z-50"
          style={{ background: '#0b0f1a', border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
        >
          <div className="scale-125">
            <LogoMark />
          </div>
        </button>
      </div>
    </div>
  );
}
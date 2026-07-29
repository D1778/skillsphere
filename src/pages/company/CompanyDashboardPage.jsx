import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../../components/shared/Topbar';
import { getCompanyDashboard, updateApplicantStatus } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

/* --- Shared Icons --- */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconUserCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
  </svg>
);
const IconLineChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconSparkles = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18m9-9H3m15.36-6.36L5.64 19.64M19.64 19.64L5.64 5.64"/>
  </svg>
);
const IconLocation = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconRefresh = ({ spinning }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'animate-spin' : ''}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

/* --- Avatar with no external network dependency (initials fallback) ---
   Same fix as the Candidates page: never rely on a third-party avatar
   service that might be unreachable, and gracefully fall back if an
   uploaded photo fails to load. */
const AVATAR_PALETTE = [
  'from-indigo-500 to-purple-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500', 'from-pink-500 to-rose-500', 'from-violet-500 to-fuchsia-500',
];
const paletteFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};
function Avatar({ src, name, size = 48 }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  return src && !failed ? (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`rounded-full bg-gradient-to-br ${paletteFor(name)} flex items-center justify-center shrink-0`}
      style={{ width: size, height: size }}
    >
      <span className="font-sans font-bold text-white" style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  );
}

const STATUS_LABEL = {
  new: 'Applied', reviewed: 'Under Review', shortlisted: 'Shortlisted',
  interview: 'Interview', hired: 'Hired', rejected: 'Rejected',
};
const STATUS_COLOR = {
  new: '#38bdf8', reviewed: '#818cf8', shortlisted: '#65a30d',
  interview: '#facc15', hired: '#34d399', rejected: '#f87171',
};

/* ══════════════════════════════════════════════════
   Applicants-over-time chart — driven by real weekly
   counts from the backend instead of a fixed mock curve.
══════════════════════════════════════════════════ */
function ApplicantsChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  const W = 1000, H = 200;
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const stepX = data.length > 1 ? W / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: data.length > 1 ? i * stepX : W / 2,
    y: H - 10 - (d.count / maxCount) * (H - 20),
    ...d,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 1
    ? `${linePath} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
    : '';

  const handleMouseMove = (e) => {
    if (!containerRef.current || !points.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0, nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < nearestDist) { nearestDist = dist; nearest = i; }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const totalApplicants = data.reduce((sum, d) => sum + d.count, 0);

  if (!totalApplicants) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 font-sans text-sm">No applications yet — once candidates start applying, you'll see the trend here.</div>;
  }

  return (
    <div
      className="flex-1 relative w-full h-full mt-2 cursor-crosshair group"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0"/>
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill="url(#chartGrad)"/>}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="#a3e635" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hoverIndex === i ? 6 : 4} fill="#a3e635" vectorEffect="non-scaling-stroke"/>
        ))}
        {hovered && (
          <line x1={hovered.x} y1="0" x2={hovered.x} y2={H} stroke="#a3e635" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="pointer-events-none opacity-80"/>
        )}
      </svg>

      {hovered && (
        <div
          className="absolute top-0 -translate-x-1/2 pointer-events-none bg-[#0f172a] border border-[#a3e635]/50 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all duration-75 z-10"
          style={{ left: `${(hovered.x / W) * 100}%`, marginTop: '-20px' }}
        >
          <div className="text-[#a3e635] font-sans font-bold text-sm text-center">{hovered.count}</div>
          <div className="text-gray-400 font-sans text-[0.65rem] uppercase text-center tracking-wider">Applicants</div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-1 text-gray-500 font-sans text-[0.75rem] pointer-events-none">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Hiring funnel — band widths are proportional to each
   stage's real (cumulative) applicant count; hovering a
   band shows its exact count and % of total applied.
══════════════════════════════════════════════════ */
const FUNNEL_COLORS = ['#06b6d4', '#8b5cf6', '#65a30d', '#38bdf8', '#c084fc'];

function HiringFunnel({ data }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (!data?.length || !data[0].count) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 font-sans text-sm text-center px-4">No applicants yet — post a job to start building your pipeline.</div>;
  }

  const CHART_WIDTH = 190, MIN_WIDTH = 34, BAND_HEIGHT = 42, GAP = 5, CENTER_X = 140;
  const maxCount = data[0].count;
  const widthFor = (count) => MIN_WIDTH + (CHART_WIDTH - MIN_WIDTH) * (count / maxCount);

  let y = 6;
  const bands = data.map((stage, i) => {
    const topW = widthFor(stage.count);
    const bottomW = widthFor(data[i + 1]?.count ?? stage.count);
    const top = y;
    const bottom = y + BAND_HEIGHT;
    y = bottom + GAP;
    const points = [
      [CENTER_X - topW / 2, top], [CENTER_X + topW / 2, top],
      [CENTER_X + bottomW / 2, bottom], [CENTER_X - bottomW / 2, bottom],
    ].map((p) => p.join(',')).join(' ');
    return { ...stage, points, top, bottom, topW, color: FUNNEL_COLORS[i % FUNNEL_COLORS.length] };
  });
  const totalHeight = y;
  const hovered = bands.find((b) => b.key === hoveredKey);

  return (
    <div className="flex-1 relative w-full flex justify-center items-center overflow-hidden">
      <svg viewBox={`0 0 320 ${totalHeight}`} className="w-full h-full max-h-[220px] max-w-full object-contain overflow-visible">
        {bands.map((b) => (
          <g
            key={b.key}
            onMouseEnter={() => setHoveredKey(b.key)}
            onMouseLeave={() => setHoveredKey((h) => (h === b.key ? null : h))}
            className="cursor-pointer"
          >
            <polygon points={b.points} fill={b.color} opacity={hoveredKey && hoveredKey !== b.key ? 0.4 : 1} className="transition-opacity duration-150"/>
            <text x={CENTER_X + b.topW / 2 + 12} y={(b.top + b.bottom) / 2} fill="currentColor" className="text-gray-400 font-medium" fontSize="13" fontFamily="sans-serif" dominantBaseline="middle">
              {b.label}
            </text>
          </g>
        ))}
      </svg>

      {hovered && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0f172a] border px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap"
          style={{ borderColor: hovered.color }}
        >
          <div className="font-sans font-bold text-sm text-center" style={{ color: hovered.color }}>{hovered.count} candidate{hovered.count === 1 ? '' : 's'}</div>
          <div className="text-gray-400 font-sans text-[0.7rem] text-center">{hovered.percent}% of applied</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   AI recommended candidate card
══════════════════════════════════════════════════ */
function RecommendedCandidateCard({ candidate, onShortlist, shortlisting }) {
  const navigate = useNavigate();
  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex gap-4 min-w-0">
          <Avatar src={fileUrl(candidate.photoURL)} name={candidate.name} size={48} />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans text-[1rem] font-semibold text-white truncate">{candidate.name}</span>
              <span className="flex items-center gap-1 bg-[#8b5cf6]/20 text-[#c4b5fd] font-sans text-[0.65rem] font-semibold px-1.5 py-0.5 rounded border border-[#8b5cf6]/30 uppercase tracking-wider shrink-0"><IconSparkles /> AI pick</span>
            </div>
            <span className="font-sans text-[0.85rem] text-gray-400 mt-0.5 truncate">{candidate.title || '—'}</span>
            {candidate.location && (
              <span className="flex items-center gap-1 font-sans text-[0.75rem] text-gray-500 mt-1"><IconLocation /> {candidate.location}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="font-sans text-[1.1rem] font-bold text-[#38bdf8]">{candidate.matchPercent != null ? `${candidate.matchPercent}%` : '—'}</span>
          <span className="font-sans text-[0.7rem] text-gray-500">match</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {candidate.skills.length ? candidate.skills.map((s) => (
          <span key={s} className="font-sans text-[0.75rem] text-gray-300 bg-white/5 px-2.5 py-1 rounded">{s}</span>
        )) : <span className="font-sans text-[0.75rem] text-gray-500 italic">No skills listed</span>}
      </div>

      <p className="font-sans text-[0.78rem] text-gray-400 mb-5 leading-relaxed line-clamp-2">
        {candidate.reason || `Applied for ${candidate.jobTitle}.`}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/applications?job=${candidate.jobId}`)}
          className="flex-1 bg-gradient-to-r from-[#22d3ee] to-[#8b5cf6] text-white font-sans text-[0.85rem] font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          View profile
        </button>
        {candidate.status === 'shortlisted' ? (
          <button
            onClick={() => onShortlist(candidate)}
            disabled={shortlisting}
            className="flex-1 bg-[#65a30d]/15 border border-[#65a30d]/40 text-[#a3e635] font-sans text-[0.85rem] font-semibold py-2 rounded-lg hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {shortlisting ? 'Updating…' : 'Remove from shortlist'}
          </button>
        ) : (
          <button
            onClick={() => onShortlist(candidate)}
            disabled={shortlisting}
            className="flex-1 bg-transparent border border-white/10 text-white font-sans text-[0.85rem] font-semibold py-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
          >
            {shortlisting ? 'Shortlisting…' : 'Shortlist'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingAI, setRefreshingAI] = useState(false);
  const [shortlistingId, setShortlistingId] = useState(null);

  const load = useCallback(async (opts) => {
    try {
      const data = await getCompanyDashboard(opts);
      setDashboard(data);
      setError('');
    } catch {
      setError('Could not load your dashboard. Please try again.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleRefreshRecommendations = async () => {
    setRefreshingAI(true);
    await load({ refresh: true });
    setRefreshingAI(false);
  };

  const handleShortlist = async (candidate) => {
    // Toggle: already shortlisted → send back to "reviewed" (un-shortlist);
    // otherwise → shortlist them.
    const nextStatus = candidate.status === 'shortlisted' ? 'reviewed' : 'shortlisted';

    setShortlistingId(candidate.candidateId);
    try {
      await updateApplicantStatus(candidate.jobId, candidate.candidateId, nextStatus);

      // Flip the button immediately rather than waiting on a full
      // dashboard re-fetch — this candidate's status is looked up live
      // on the backend (not part of the AI-pick cache), so this is just
      // matching what the next load() would show anyway.
      setDashboard((prev) => prev && {
        ...prev,
        recommendedCandidates: prev.recommendedCandidates.map((c) =>
          c.candidateId === candidate.candidateId && c.jobId === candidate.jobId
            ? { ...c, status: nextStatus }
            : c
        ),
      });

      // Still refresh in the background so stats/funnel/recent applicants
      // catch up too, without blocking the button's instant feedback.
      load();
    } catch {
      setError('Could not update that candidate — please try again.');
    } finally {
      setShortlistingId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = dashboard?.stats;
  const statCards = stats ? [
    { icon: <IconBriefcase />, value: stats.activeJobs.value, label: 'Active jobs', delta: stats.activeJobs.delta, color: '#818cf8', glow: 'rgba(99,102,241,0.18)', bgIcon: 'rgba(99,102,241,0.12)' },
    { icon: <IconUsers />, value: stats.totalApplicants.value, label: 'Total applicants', delta: stats.totalApplicants.delta, color: '#22d3ee', glow: 'rgba(6,182,212,0.18)', bgIcon: 'rgba(6,182,212,0.12)' },
    { icon: <IconUserCheck />, value: stats.shortlisted.value, label: 'Shortlisted', delta: stats.shortlisted.delta, color: '#a78bfa', glow: 'rgba(167,139,250,0.18)', bgIcon: 'rgba(167,139,250,0.12)' },
    { icon: <IconLineChart />, value: stats.avgTimeToHireDays != null ? `${stats.avgTimeToHireDays}d` : '—', label: 'Avg. time-to-hire', delta: null, color: '#34d399', glow: 'rgba(52,211,153,0.18)', bgIcon: 'rgba(52,211,153,0.12)' },
  ] : [];

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-10">
        <div className="flex flex-col">
          <div className="font-sans text-[0.9rem] font-bold text-indigo-400 mb-1 flex items-center gap-2">
            {getGreeting()}, Recruiter <span className="inline-block animate-[wave_2.5s_infinite] origin-[70%_70%] text-base">👋</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans flex items-center gap-2">
            Dashboard
          </div>
          <p className="font-sans text-[0.95rem] text-gray-400 mt-1.5 font-medium">Hire on verified skills. Here's your pipeline at a glance.</p>
        </div>
        <div className="flex-shrink-0">
          <button onClick={() => navigate('/postings')} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold font-sans text-[0.9rem] py-2.5 px-4.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <IconPlus /> Post a job
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 font-sans text-[0.85rem]">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 font-sans text-sm gap-3">
          <div className="w-5 h-5 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
          Loading your dashboard…
        </div>
      ) : dashboard ? (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statCards.map((s, i) => (
              <div key={i} className="relative flex flex-col items-center justify-center p-6 card-glass rounded-2xl transition-all duration-300 hover:-translate-y-1 group/statcard" style={{ '--card-glow': s.glow }}>
                {s.delta != null && s.delta > 0 && (
                  <span className="absolute top-4 right-4 text-[0.7rem] font-bold px-1.5 py-0.5 rounded flex items-center font-sans" style={{ color: s.color, background: s.bgIcon }}>
                    ↑ {s.delta}
                  </span>
                )}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-[0_4px_12px_var(--card-glow)] transition-transform duration-300 group-hover/statcard:scale-110 group-hover/statcard:-rotate-3" style={{ background: s.bgIcon, color: s.color }}>
                  {s.icon}
                </div>
                <div className="font-sans text-[1.8rem] font-extrabold tracking-tight mb-1 transition-all duration-300 group-hover/statcard:drop-shadow-[0_0_12px_var(--card-glow)]" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="font-sans text-[0.8rem] font-medium text-gray-400 uppercase tracking-[0.06em]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
            <div className="lg:col-span-3 card-glass rounded-2xl p-6 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-sans text-[1.05rem] font-semibold text-white">Applicants over time</h3>
              </div>
              <ApplicantsChart data={dashboard.applicantsOverTime} />
            </div>

            <div className="card-glass rounded-2xl p-6 flex flex-col h-[320px]">
              <h3 className="font-sans text-[1.05rem] font-semibold text-white mb-6">Hiring funnel</h3>
              <HiringFunnel data={dashboard.hiringFunnel} />
            </div>
          </div>

          {/* ── AI Recommended Candidates ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-sans text-[1.25rem] font-bold text-white">AI recommended candidates</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefreshRecommendations}
                  disabled={refreshingAI}
                  className="flex items-center gap-1.5 text-[#a78bfa] font-sans text-[0.8rem] font-semibold hover:text-[#c4b5fd] disabled:opacity-50"
                >
                  <IconRefresh spinning={refreshingAI} /> Refresh
                </button>
                <button onClick={() => navigate('/candidates')} className="text-[#a78bfa] font-sans text-[0.85rem] font-semibold hover:text-[#c4b5fd]">Discover more →</button>
              </div>
            </div>
            {dashboard.recommendationsGeneratedAt && (
              <p className="font-sans text-[0.72rem] text-gray-500 mb-4">
                Updated {new Date(dashboard.recommendationsGeneratedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            )}

            {dashboard.recommendedCandidates.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dashboard.recommendedCandidates.map((c) => (
                  <RecommendedCandidateCard
                    key={`${c.candidateId}-${c.jobId}`}
                    candidate={c}
                    onShortlist={handleShortlist}
                    shortlisting={shortlistingId === c.candidateId}
                  />
                ))}
              </div>
            ) : (
              <div className="card-glass rounded-2xl p-8 text-center text-gray-400 font-sans text-[0.9rem]">
                No new applicants to recommend right now — check back once more candidates apply to your open jobs.
              </div>
            )}
          </div>

          {/* ── Recent Applicants ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans text-[1.25rem] font-bold text-white">Recent applicants</h2>
              <button onClick={() => navigate('/applications')} className="text-[#a78bfa] font-sans text-[0.85rem] font-semibold hover:text-[#c4b5fd]">View pipeline</button>
            </div>

            {dashboard.recentApplicants.length ? (
              <div className="card-glass rounded-2xl p-2">
                {dashboard.recentApplicants.map((a, i) => (
                  <div
                    key={`${a.candidateId}-${a.jobId}-${i}`}
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 ${i !== dashboard.recentApplicants.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar src={fileUrl(a.photoURL)} name={a.name} size={40} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-sans text-[0.95rem] font-semibold text-white truncate">{a.name}</span>
                        <span className="font-sans text-[0.8rem] text-gray-400 truncate">applied for {a.jobTitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-8 sm:w-auto w-full pl-14 sm:pl-0 mt-2 sm:mt-0">
                      <span className="font-sans text-[1rem] font-bold" style={{ color: STATUS_COLOR[a.status] }}>
                        {a.matchPercent != null ? `${a.matchPercent}%` : '—'}
                      </span>
                      <span className="font-sans text-[0.85rem] font-medium text-gray-300 w-24 text-right">{STATUS_LABEL[a.status] || a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-glass rounded-2xl p-8 text-center text-gray-400 font-sans text-[0.9rem]">
                No applicants yet.
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Floating AI Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0f172a] border border-[#22d3ee]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform z-50 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]">
        <div className="scale-125">
          <LogoMark />
        </div>
      </button>
    </>
  );
}
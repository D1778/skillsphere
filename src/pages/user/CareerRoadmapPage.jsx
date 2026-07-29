import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../../components/shared/Topbar';
import { useRoadmap } from '../../context/RoadmapContext';
import { transformPhase, IconTool, IconLayers, IconStar, IconTarget } from '../../utils/roadmapTransform';

/* ==========================================================================
   ICONS
   (IconCode/IconGlobe/IconBrain/IconTool/IconLayers/IconStar/IconTarget used
   for phase icons now live in ../../utils/roadmapTransform, the single
   source of truth shared with StudentDashboardPage. IconTool/IconLayers/
   IconStar/IconTarget are also used directly below outside of phase
   cards, so they're imported above rather than just used internally.)
   ========================================================================== */
const IconSparkles = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M7 4H17v7a5 5 0 0 1-10 0V4z"/><path d="M7 9H4a2 2 0 0 1-2-2V5h5"/><path d="M17 9h3a2 2 0 0 0 2-2V5h-5"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconWand = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ==========================================================================
   DATA
   ========================================================================== */
const POPULAR_ROLES = [
  'Data Scientist', 'Product Manager', 'DevOps Engineer',
  'UX Designer', 'ML Engineer', 'Cloud Architect',
];

/* ==========================================================================
   CHANGE TARGET ROLE DIALOG
   ========================================================================== */
function ChangeRoleDialog({ currentRole, onClose, onConfirm, hasPrevious, onLoadPrevious, generating, error }) {
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState('');

  const handlePick = (role) => {
    setSelected(role);
    setInputValue(role);
  };

  const handleConfirm = () => {
    if (!inputValue.trim() || generating) return;
    onConfirm(inputValue.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[560px] rounded-2xl p-7 flex flex-col"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          onClick={onClose}
        >
          <IconClose />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <IconWand />
          </div>
          <h2 className="font-sans text-[1.3rem] font-extrabold text-white">Generate a new roadmap</h2>
        </div>
        <p className="font-sans text-[0.88rem] text-gray-400 leading-relaxed mb-6">
          Enter the job role you want to aim for and Sphere AI will build a fresh, phased roadmap for it.
        </p>

        {/* Input */}
        <label className="font-sans text-[0.85rem] font-semibold text-white mb-2 block">Target job role</label>
        <input
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setSelected(''); }}
          placeholder="e.g. Data Scientist"
          className="w-full rounded-xl px-4 py-3 font-sans text-[0.92rem] text-white placeholder-gray-600 outline-none transition-all mb-5 light-dialog-input"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(34,211,238,0.4)',
            boxShadow: '0 0 0 3px rgba(34,211,238,0.08)',
          }}
          autoFocus
        />

        {/* Popular roles */}
        <div className="mb-6">
          <span className="font-sans text-[0.78rem] text-gray-500 mb-3 block">Popular roles</span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_ROLES.map(role => (
              <button
                key={role}
                onClick={() => handlePick(role)}
                data-selected={selected === role}
                className="font-sans text-[0.82rem] px-3.5 py-1.5 rounded-full border transition-all light-dialog-tag"
                style={{
                  background: selected === role ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.03)',
                  borderColor: selected === role ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.08)',
                  color: selected === role ? '#22d3ee' : '#94a3b8',
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Error from a failed generation attempt */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl border mb-5"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <div className="shrink-0 mt-0.5 text-red-400"><IconAlert /></div>
            <p className="font-sans text-[0.82rem] text-gray-300 leading-snug">{error}</p>
          </div>
        )}

        {/* Warning */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl border mb-7"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <div className="shrink-0 mt-0.5 text-amber-400"><IconAlert /></div>
          <p className="font-sans text-[0.82rem] text-gray-300 leading-snug">
            You can only save up to <strong className="text-white">2 roadmaps</strong> (current and previous). Generating a new roadmap will permanently delete any older generation.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            disabled={!hasPrevious || generating}
            className="flex items-center gap-2 font-sans text-[0.88rem] font-semibold text-gray-300 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed light-dialog-secondary-btn"
            onClick={onLoadPrevious}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Load previous
          </button>
          
          <div className="flex items-center gap-3">
            <button
              className="font-sans text-[0.88rem] font-semibold text-gray-400 px-5 py-2.5 rounded-xl border border-white/8 bg-transparent hover:bg-white/5 hover:text-white transition-all light-dialog-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              disabled={!inputValue.trim() || generating}
              onClick={handleConfirm}
              className="flex items-center gap-2 font-sans text-[0.88rem] font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed light-dialog-primary-btn"
              style={{
                background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.25) 100%)',
                color: '#22d3ee',
                boxShadow: '0 4px 14px rgba(34,211,238,0.15)',
              }}
            >
              <IconWand />
              {generating ? 'Generating…' : 'Replace & generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   RESOURCE CARD
   ========================================================================== */
function ResourceCard({ resource, color }) {
  const typeColors = {
  COURSE: '#22d3ee',
  BOOK: '#818cf8',
  DOCUMENTATION: '#10b981',
};

const tc = typeColors[resource.type?.toUpperCase()] || '#94a3b8';
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-xl border transition-all cursor-pointer group"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `rgba(255,255,255,0.05)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    >
      <span className="font-sans text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: tc }}>{resource.type}</span>
      <span className="font-sans text-[0.9rem] font-semibold text-white leading-tight">{resource.title}</span>
      <span className="font-sans text-[0.76rem] text-gray-500">{resource.author}</span>
    </div>
  );
}

/* ==========================================================================
   PHASE CARD
   ========================================================================== */
function PhaseCard({ phase, index, isExpanded, onToggle, nextColor, isLast }) {
  return (
    <div className="relative flex gap-5 mb-0">
      {/* Timeline Column */}
      <div className="flex flex-col items-center shrink-0" style={{ width: '44px' }}>

        {/* Phase number circle */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-sans text-[1.1rem] font-extrabold shrink-0 z-10 transition-all duration-300 relative"
          style={{
            background: 'var(--bg-deep)',
            color: phase.color,
            border: `2.5px solid ${phase.color}`,
            boxShadow: isExpanded
              ? `0 0 0 5px ${phase.glowColor}, 0 0 28px ${phase.glowColor}, inset 0 0 12px ${phase.glowColor}`
              : `0 0 16px ${phase.glowColor}, inset 0 0 8px ${phase.glowColor}`,
          }}
        >
          {/* Inner glow ring */}
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${phase.glowColor} 0%, transparent 70%)`, opacity: 0.6 }}
          />
          <span className="relative z-10">{phase.phase}</span>
        </div>

        {/* Multicolor gradient connector line */}
        {!isLast && (
          <div className="flex-1 w-0.5 mt-1 mb-1 relative overflow-hidden" style={{ minHeight: '48px' }}>
            <svg
              width="4"
              height="100%"
              viewBox="0 0 4 100"
              preserveAspectRatio="none"
              className="w-full h-full"
              style={{ display: 'block' }}
            >
              <defs>
                <linearGradient id={`line-grad-${phase.phase}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={phase.color}  stopOpacity="0.9" />
                  <stop offset="50%"  stopColor={nextColor || phase.color} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={nextColor || phase.color} stopOpacity="0.15" />
                </linearGradient>
                {/* Dashed animated line overlay */}
                <linearGradient id={`line-glow-${phase.phase}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={phase.color}  stopOpacity="0.3" />
                  <stop offset="100%" stopColor={nextColor || phase.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Base solid line */}
              <rect x="1" y="0" width="2" height="100" fill={`url(#line-grad-${phase.phase})`} rx="1" />
              {/* Soft glow blur on top */}
              <rect x="0" y="0" width="4" height="100" fill={`url(#line-glow-${phase.phase})`} rx="2" />
            </svg>
          </div>
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer mb-6 card-glass"
        style={{
          background: phase.cardBg,
          borderColor: isExpanded ? phase.colorBorder : 'var(--border-subtle)',
          boxShadow: isExpanded ? `0 0 40px ${phase.glowColor}` : 'var(--shadow-card)',
        }}
      >
        {/* Card Header — always visible */}
        <div className="p-5 select-none" onClick={onToggle}>
          <div className="flex items-start justify-between gap-4">
            {/* Left: icon + text */}
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: phase.colorBg, color: phase.color, border: `1px solid ${phase.colorBorder}` }}
              >
                {phase.icon}
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <h2 className="font-sans text-[1.2rem] font-extrabold text-white leading-tight">{phase.name}</h2>
                </div>
                <p className="font-sans text-[0.82rem]" style={{ color: phase.color }}>{phase.subtitle}</p>
              </div>
            </div>

            {/* Right: tags + chevron */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span
                className="font-sans text-[0.72rem] font-semibold px-2.5 py-1 rounded-md border tracking-wide whitespace-nowrap hidden sm:block"
                style={{ color: phase.color, background: phase.colorBg, borderColor: phase.colorBorder }}
              >
                {phase.difficultyTag}
              </span>
              <div className={`transition-transform duration-300 text-gray-500 ${isExpanded ? 'rotate-180' : ''}`}>
                <IconChevronDown />
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-[0.87rem] text-gray-400 leading-relaxed mt-4">{phase.description}</p>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-5 pb-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

            {/* What you'll work on */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: phase.color }}><IconLayers /></span>
                <span className="font-sans text-[0.7rem] font-bold tracking-widest uppercase text-gray-500">What you'll work on</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {phase.workOn.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: phase.color }} />
                    <span className="font-sans text-[0.875rem] text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-px my-5" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* What you'll build */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: phase.color }}><IconTool /></span>
                <span className="font-sans text-[0.7rem] font-bold tracking-widest uppercase text-gray-500">What you'll build</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {phase.build.map((item, i) => (
  <div key={i} className="flex gap-3 items-start">
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-black mt-1"
      style={{ background: phase.color }}
    >
      <IconCheck />
    </div>

    <div className="flex flex-col">
      <span className="font-sans text-[0.9rem] font-semibold text-white">
        {item.title}
      </span>

      <span className="font-sans text-[0.8rem] text-gray-400 leading-relaxed">
        {item.description}
      </span>
    </div>
  </div>
))}
              </div>
            </div>

            <div className="w-full h-px my-5" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* Skills you'll gain */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: phase.color }}><IconArrowUp /></span>
                <span className="font-sans text-[0.7rem] font-bold tracking-widest uppercase text-gray-500">Skills you'll gain</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {phase.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="font-sans text-[0.78rem] font-semibold px-3 py-1 rounded-full border"
                    style={{ color: phase.color, background: phase.colorBg, borderColor: phase.colorBorder }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>



            {/* Outcome */}
            <div
              className="mt-5 flex items-center gap-3 p-4 rounded-xl border"
              style={{ borderColor: phase.colorBorder, background: phase.colorBg }}
            >
              <span style={{ color: phase.color }}><IconTrophy /></span>
              <span className="font-sans text-[0.875rem] text-gray-300">
                <strong className="text-white">Outcome:</strong> {phase.outcome}
              </span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   STATS ROW
   ========================================================================== */
function StatsRow({ phases }) {
  const phaseCount = phases.length;
  const focusAreaCount = phases.reduce((sum, p) => sum + (p.workOn?.length || 0), 0);
  const skillCount = new Set(phases.flatMap(p => p.skills || [])).size;

  const stats = [
    { icon: <IconTarget />, value: phaseCount, label: 'Phases', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.15)' },
    { icon: <IconLayers />, value: focusAreaCount, label: 'Focus areas', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.15)' },
    { icon: <IconSparkles />, value: skillCount, label: 'Skills to gain', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.15)' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl p-4 border transition-all hover:scale-[1.02] light-stats-card"
          style={{ background: stat.bg, borderColor: stat.border }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 stat-icon"
            style={{ background: `${stat.bg}`, color: stat.color, border: `1px solid ${stat.border}` }}
          >
            {stat.icon}
          </div>
          <div>
            <div className="font-sans text-[1.6rem] font-extrabold text-white leading-none">{stat.value}</div>
            <div className="font-sans text-[0.76rem] text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   MAIN PAGE EXPORT
   ========================================================================== */
export default function CareerRoadmapPage() {
  const navigate = useNavigate();
  const {
    phases: rawPhases,
    targetRole,
    hasPrevious,
    generate,
    loadPreviousRoadmap,
    generating,
    error,
  } = useRoadmap();
  const phases = rawPhases.map(transformPhase);
  const [expandedPhase, setExpandedPhase] = useState(1);
  const [showDialog, setShowDialog] = useState(false);

  const handleToggle = (phaseNum) => {
    setExpandedPhase(prev => prev === phaseNum ? null : phaseNum);
  };

  const handleRoleConfirm = async (newRole) => {
    const success = await generate(newRole); // updates context → dashboard updates too
    if (success) setShowDialog(false);
  };

  const handleLoadPrevious = async () => {
    const success = await loadPreviousRoadmap();
    if (success) setShowDialog(false);
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 mt-0">
        <div className="flex flex-col">
          <div className="mb-1 min-h-[20px]"></div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans flex items-center gap-2 tracking-tight leading-tight">Career Roadmap</h1>
          <p className="font-sans text-[0.95rem] text-gray-400 mt-1.5 font-medium">
            Your AI-generated path to{' '}
            <span className="text-white font-semibold">{targetRole}</span> readiness.
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 font-sans text-[0.85rem] font-semibold px-5 py-2.5 rounded-xl border transition-all shrink-0 hover:scale-105 light-target-btn"
          style={{
            background: 'rgba(34,211,238,0.08)',
            borderColor: 'rgba(34,211,238,0.28)',
            color: '#22d3ee',
            boxShadow: '0 0 16px rgba(34,211,238,0.12)',
          }}
        >
          <IconWand />
          Change target role
        </button>
      </div>

      {/* Stats */}
      <StatsRow phases={phases} />

      {/* Phases timeline */}
      <div className="flex flex-col">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.phase}
            phase={phase}
            index={index}
            isLast={index === phases.length - 1}
            nextColor={phases[index + 1]?.color}
            isExpanded={expandedPhase === phase.phase}
            onToggle={() => handleToggle(phase.phase)}
          />
        ))}
      </div>

      {/* Change role dialog */}
      {showDialog && (
        <ChangeRoleDialog
          currentRole={targetRole}
          hasPrevious={hasPrevious}
          generating={generating}
          error={error}
          onClose={() => setShowDialog(false)}
          onConfirm={handleRoleConfirm}
          onLoadPrevious={handleLoadPrevious}
        />
      )}

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
/**
 * src/utils/roadmapTransform.jsx
 *
 * Single source of truth for turning a raw backend phase object
 * (as returned by GET /api/roadmap and POST /api/roadmap/generate:
 *   { id, title, subtitle, description, icon, color, level,
 *     estimatedHours, estimatedWeeks, topics[], projects[], skills[],
 *     resources[], outcome }
 * ) into the shape the UI actually renders (hex colors, a JSX icon,
 * a formatted level tag, etc).
 *
 * Previously this logic (and the icon set it depends on) was
 * duplicated across CareerRoadmapPage and StudentDashboardPage, and
 * the two copies drifted apart — StudentDashboardPage kept assuming
 * an old phase-number-keyed, Tailwind-class PHASE_COLORS shape while
 * CareerRoadmapPage moved on to RoadmapContext's color-name-keyed hex
 * palette. That mismatch is what caused the earlier crash. Anything
 * that displays a roadmap phase should import transformPhase from
 * here instead of reimplementing this mapping.
 */

import React from 'react';
import { PHASE_COLORS } from '../context/RoadmapContext';

/* ==========================================================================
   ICONS — the fixed set of phase icons a transformed phase can use.
   Exported individually since a couple of pages also use one or two
   of these directly outside of a phase card (e.g. section headers,
   stat rows).
   ========================================================================== */
export const IconCode = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
export const IconGlobe = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
export const IconBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.975-3.23A3 3 0 0 1 3 13V8a2 2 0 0 1 2-2h4z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.975-3.23A3 3 0 0 0 21 13V8a2 2 0 0 0-2-2h-4z"/>
  </svg>
);
export const IconTool = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
export const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
export const IconStar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
export const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

/* ==========================================================================
   LEVEL TAG — raw backend `level` string -> emoji-prefixed display tag.
   ========================================================================== */
export const LEVEL_TAG = {
  Foundational: '🧱 Foundational',
  Intermediate: '⚙️ Intermediate',
  Advanced:     '🚀 Advanced',
  Mastery:      '🏆 Mastery',
};

/** Lucide-style icon names the model tends to pick -> our local icon set. */
const ICON_NAME_MAP = {
  code: 'code', terminal: 'code', git: 'code',
  server: 'globe', cloud: 'globe', network: 'globe',
  brain: 'brain', 'graduation-cap': 'brain',
  container: 'tool', wrench: 'tool', settings: 'tool', cog: 'tool',
  database: 'layers', layers: 'layers', 'layout-grid': 'layers',
  shield: 'star', 'shield-check': 'star', award: 'star', trophy: 'star',
  cpu: 'target', target: 'target', crosshair: 'target',
};

export function getPhaseIcon(iconName) {
  const key = ICON_NAME_MAP[iconName?.toLowerCase()] || 'code';
  const map = {
    code:   <IconCode />,
    globe:  <IconGlobe />,
    brain:  <IconBrain />,
    tool:   <IconTool />,
    layers: <IconLayers />,
    star:   <IconStar />,
    target: <IconTarget />,
  };
  return map[key];
}

/* ==========================================================================
   BACKEND -> UI TRANSFORM
   ========================================================================== */
export function transformPhase(phase) {
  const palette = PHASE_COLORS[phase.color] || PHASE_COLORS.blue;
  return {
    phase: phase.id,
    name: phase.title,
    subtitle: phase.subtitle,
    difficulty: phase.level,
    difficultyTag: LEVEL_TAG[phase.level] || phase.level,
    icon: getPhaseIcon(phase.icon),
    color: palette.text,
    colorBg: palette.bg,
    colorBorder: palette.border,
    glowColor: palette.glow,
    cardBg: `linear-gradient(135deg, ${palette.bg} 0%, transparent 60%)`,
    numBg: palette.text,
    timeLabel: `~${phase.estimatedHours}h · ${phase.estimatedWeeks} weeks`,
    description: phase.description,
    workOn: phase.topics || [],
    build: phase.projects || [],
    skills: phase.skills || [],
    resources: phase.resources || [],
    outcome: phase.outcome,
  };
}
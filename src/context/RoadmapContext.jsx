/**
 * src/context/RoadmapContext.jsx
 *
 * Talks to the real backend (/api/roadmap) instead of holding dummy data.
 * Backend guarantees at most 2 saved roadmaps per user:
 *   - current  : the active roadmap (shown on this page + dashboard)
 *   - previous : whatever "current" was before the last generation
 *
 * generate(targetRole) rotates current -> previous (discarding the old
 * previous) and calling loadPreviousRoadmap() swaps current <-> previous,
 * so it doubles as undo/redo.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getRoadmap,
  generateRoadmap as apiGenerateRoadmap,
  loadPreviousRoadmap as apiLoadPreviousRoadmap,
} from '../services/api';

/* ── Palette per backend `color` enum: blue | purple | green | orange ── */
export const PHASE_COLORS = {
  blue: {
    text: '#22d3ee',
    bg: 'rgba(34,211,238,0.10)',
    border: 'rgba(34,211,238,0.22)',
    glow: 'rgba(34,211,238,0.18)',
  },
  purple: {
    text: '#818cf8',
    bg: 'rgba(129,140,248,0.10)',
    border: 'rgba(129,140,248,0.22)',
    glow: 'rgba(129,140,248,0.18)',
  },
  green: {
    text: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.22)',
    glow: 'rgba(52,211,153,0.18)',
  },
  orange: {
    text: '#fb923c',
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.22)',
    glow: 'rgba(251,146,60,0.18)',
  },
};

const RoadmapContext = createContext(null);

export function RoadmapProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [current, setCurrent]     = useState(null);
  const [previous, setPrevious]   = useState(null);
  const [loading, setLoading]     = useState(true);   // initial GET /roadmap
  const [generating, setGenerating] = useState(false); // POST /roadmap/generate (slow, hits an LLM)
  const [error, setError]         = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRoadmap();
      setCurrent(result.current || null);
      setPrevious(result.previous || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load your roadmap.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Wait for AuthContext to resolve first. Firing this unconditionally
  // (the old behavior) meant it ran even when nobody was signed in —
  // 401'd, found no refresh token either, and the API layer's response
  // interceptor sent the browser to /signin via `window.location.href`.
  // If that happened while already on /signin (or any page that mounts
  // this provider pre-auth), reassigning location.href to the same URL
  // forces a full reload — which reruns this exact effect again on
  // mount, 401s again, redirects again: an infinite reload loop.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCurrent(null);
      setPrevious(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [authLoading, user, refresh]);

  const generate = useCallback(async (targetRole) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await apiGenerateRoadmap(targetRole);
      setCurrent(result.current || null);
      setPrevious(result.previous || null);
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate roadmap. Please try again.');
      return false;
    } finally {
      setGenerating(false);
    }
  }, []);

  const loadPreviousRoadmap = useCallback(async () => {
    setError(null);
    try {
      const result = await apiLoadPreviousRoadmap();
      setCurrent(result.current || null);
      setPrevious(result.previous || null);
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || 'No previous roadmap to load.');
      return false;
    }
  }, []);

  const value = {
    current,
    previous,
    targetRole: current?.targetRole || null,
    hasPrevious: !!previous,
    phases: current?.phases || [],
    stats: current?.stats || null,
    totalHours: current?.totalHours || 0,
    totalWeeks: current?.totalWeeks || 0,
    loading,
    generating,
    error,
    generate,
    loadPreviousRoadmap,
    refresh,
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
}

export function useRoadmap() {
  const ctx = useContext(RoadmapContext);
  if (!ctx) throw new Error('useRoadmap must be used within a <RoadmapProvider>');
  return ctx;
}
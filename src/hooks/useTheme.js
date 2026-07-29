import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Shared theme hook — reads/writes to localStorage + syncs with OS preference.
 * Sets data-theme on <html> so all CSS vars work instantly.
 *
 * Uses a module-level store (not component-local useState) so every
 * component calling useTheme() shares the SAME value. Without this,
 * each call site gets its own independent state, and toggling the
 * theme in one component (e.g. Navbar) never updates another (e.g.
 * HomePage) — which is what caused the mismatched dark/light render.
 */

const STORAGE_KEY = 'ss-theme';
const listeners = new Set();

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  if (window.matchMedia) return 'light';
  return 'dark';
}

let currentTheme = getInitialTheme();

// Apply immediately at module load (before any component mounts) so
// there's no flash / race where canvases read a stale data-theme.
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function setTheme(theme) {
  if (theme === currentTheme) return;
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentTheme;
}

function getServerSnapshot() {
  return 'dark';
}

export default function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === 'dark';

  // Keep in sync with OS-level changes, but only while the user hasn't
  // made an explicit choice (i.e. nothing saved yet in localStorage).
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (localStorage.getItem(STORAGE_KEY)) return; // explicit choice wins
      setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, []);

  return { isDark, toggleTheme };
}
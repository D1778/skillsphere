import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const pad = (n) => String(n).padStart(2, '0');
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

const POPOVER_WIDTH = 280;
const POPOVER_GAP = 8;

/**
 * Themed replacement for <input type="date"> — same custom-popover
 * pattern as MonthYearPicker (profile builder), extended one level
 * further down to a real day grid so it can pick an exact date
 * instead of just a month.
 *
 * The popover itself is rendered through a portal into document.body
 * and positioned with `fixed` coordinates computed from the trigger's
 * bounding rect. This is what keeps it floating above every other
 * card on the page — without the portal, an absolutely-positioned
 * popover is trapped inside whichever card's stacking context it's
 * nested in (card-glass uses backdrop-filter, which creates one), so
 * any later card in the DOM would paint on top of it regardless of
 * z-index.
 *
 * value:    string in "YYYY-MM-DD" format (or "")
 * onChange: (nextValue: string) => void
 * minDate:  optional Date — days before this are shown disabled
 */
export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select a date',
  minDate = null,
  hasError = false,
  minYear = new Date().getFullYear() - 1,
  maxYear = new Date().getFullYear() + 10,
}) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState('days'); // 'days' | 'months' | 'years'
  const [coords, setCoords] = useState({ top: 0, left: 0, width: POPOVER_WIDTH, openUpward: false });
  const wrapRef = useRef(null);
  const popoverRef = useRef(null);

  const today = new Date();
  const [vYear, vMonth, vDay] = value ? value.split('-').map(Number) : [null, null, null];

  const [viewYear, setViewYear] = useState(vYear || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(vMonth ? vMonth - 1 : today.getMonth());
  const [decadeStart, setDecadeStart] = useState(Math.floor((vYear || today.getFullYear()) / 12) * 12);

  const min = minDate ? startOfDay(minDate) : null;

  const computeCoords = useCallback(() => {
    const trigger = wrapRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const estimatedHeight = 360; // rough popover height, enough to decide flip direction

    const openUpward = rect.bottom + estimatedHeight + POPOVER_GAP > viewportH && rect.top > estimatedHeight;
    const width = Math.min(POPOVER_WIDTH, viewportW - 16);
    let left = rect.left;
    if (left + width > viewportW - 8) left = viewportW - width - 8;
    if (left < 8) left = 8;

    const top = openUpward ? rect.top - POPOVER_GAP : rect.bottom + POPOVER_GAP;

    setCoords({ top, left, width, openUpward });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computeCoords();
  }, [open, level, computeCoords]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
        setLevel('days');
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') { setOpen(false); setLevel('days'); }
    }
    function handleReposition() { computeCoords(); }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, computeCoords]);

  const openPicker = () => {
    const y = vYear || today.getFullYear();
    const m = vMonth ? vMonth - 1 : today.getMonth();
    setViewYear(y);
    setViewMonth(m);
    setDecadeStart(Math.floor(y / 12) * 12);
    setLevel('days');
    setOpen(true);
  };

  const pickDay = (day) => {
    onChange(toKey(viewYear, viewMonth, day));
    setOpen(false);
    setLevel('days');
  };

  const pickMonth = (mIdx) => {
    setViewMonth(mIdx);
    setLevel('days');
  };

  const pickYear = (y) => {
    setViewYear(y);
    setLevel('months');
  };

  const shiftMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const display = vYear && vMonth && vDay ? `${vDay} ${MONTHS[vMonth - 1]} ${vYear}` : '';
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isDisabled = (day) => min ? new Date(viewYear, viewMonth, day) < min : false;
  const isToday = (day) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  const isSelected = (day) => vYear === viewYear && vMonth === viewMonth + 1 && vDay === day;

  const popover = open ? createPortal(
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: coords.openUpward ? undefined : coords.top,
        bottom: coords.openUpward ? window.innerHeight - coords.top : undefined,
        left: coords.left,
        width: coords.width,
      }}
      className="z-[1000] max-w-[90vw] bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-xl shadow-2xl p-3.5 animate-[fade-in_0.15s_ease-out]"
    >

      {level === 'days' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" onClick={() => { setDecadeStart(Math.floor(viewYear / 12) * 12); setLevel('months'); }} className="font-semibold text-sm text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors font-sans">
              {MONTHS_FULL[viewMonth]} {viewYear}
            </button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[0.7rem] font-semibold text-[var(--text-muted)] font-sans py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => day === null ? (
              <div key={`b${idx}`} />
            ) : (
              <button
                type="button"
                key={day}
                disabled={isDisabled(day)}
                onClick={() => pickDay(day)}
                className={`aspect-square rounded-lg text-[0.85rem] font-sans transition-all flex items-center justify-center
                  ${isSelected(day) ? 'bg-indigo-500 text-white font-semibold' :
                    isDisabled(day) ? 'text-[var(--text-muted)] opacity-30 cursor-not-allowed' :
                    'text-[var(--text-primary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]'}
                  ${isToday(day) && !isSelected(day) ? 'ring-1 ring-[var(--accent-border)]' : ''}`}
              >
                {day}
              </button>
            ))}
          </div>
        </>
      )}

      {level === 'months' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" aria-label="Previous year" onClick={() => setViewYear(y => Math.max(minYear, y - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" onClick={() => setLevel('years')} className="font-semibold text-sm text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors font-sans">
              {viewYear}
            </button>
            <button type="button" aria-label="Next year" onClick={() => setViewYear(y => Math.min(maxYear, y + 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, idx) => (
              <button
                type="button"
                key={m}
                onClick={() => pickMonth(idx)}
                className={`py-2.5 rounded-lg text-[0.85rem] font-sans transition-all ${viewMonth === idx ? 'bg-indigo-500 text-white font-semibold' : 'text-[var(--text-primary)] bg-[var(--card-inner-bg)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </>
      )}

      {level === 'years' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" aria-label="Previous years" onClick={() => setDecadeStart(d => Math.max(minYear, d - 12))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">{decadeStart} – {decadeStart + 11}</span>
            <button type="button" aria-label="Next years" onClick={() => setDecadeStart(d => Math.min(maxYear, d + 12))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {years.map(y => (
              <button
                type="button"
                key={y}
                disabled={y < minYear || y > maxYear}
                onClick={() => pickYear(y)}
                className={`py-2.5 rounded-lg text-[0.85rem] font-sans transition-all
                  ${y === viewYear ? 'bg-indigo-500 text-white font-semibold' :
                    (y < minYear || y > maxYear) ? 'text-[var(--text-muted)] opacity-30 cursor-not-allowed' :
                    'text-[var(--text-primary)] bg-[var(--card-inner-bg)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </>
      )}

    </div>,
    document.body
  ) : null;

  return (
    <div className="relative w-full" ref={wrapRef}>
      <button
        type="button"
        id={id}
        onClick={() => (open ? (setOpen(false), setLevel('days')) : openPicker())}
        className={`flex items-center justify-between gap-2 cursor-pointer w-full bg-[var(--card-inner-bg)] hover:bg-[var(--bg-card-hover)] border ${hasError ? 'border-red-500/60' : open ? 'border-[var(--accent-border-strong)] ring-2 ring-[var(--accent-border)]' : 'border-[var(--border-card)]'} rounded-xl px-4 py-3 text-[var(--text-primary)] font-sans text-[0.95rem] transition-all text-left`}
      >
        <span className={display ? '' : 'text-[var(--text-muted)]'}>{display || placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {popover}
    </div>
  );
}
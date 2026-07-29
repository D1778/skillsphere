import React, { useState, useRef, useEffect } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Themed replacement for <input type="month">.
 * - Opens on a single click (no native picker-icon dance).
 * - Fully custom popover styled with the app's own CSS variables/classes,
 *   so it matches dark/light theme instead of the browser's default UI.
 * - Year navigation is a real click target (prev/next + a year grid),
 *   so typing/incrementing years never gets stuck the way native
 *   <input type="month"> can in some browsers.
 *
 * value:    string in "YYYY-MM" format (or "")
 * onChange: (nextValue: string) => void
 */
export default function MonthYearPicker({
  id,
  value,
  onChange,
  placeholder = 'Select month',
  minYear = 1970,
  maxYear = new Date().getFullYear() + 15,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('months'); // 'months' | 'years'
  const wrapRef = useRef(null);

  const today = new Date();
  const [vYear, vMonth] = value ? value.split('-').map(Number) : [null, null];

  const [viewYear, setViewYear] = useState(vYear || today.getFullYear());
  const [decadeStart, setDecadeStart] = useState(
    Math.floor((vYear || today.getFullYear()) / 12) * 12
  );

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setMode('months');
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') { setOpen(false); setMode('months'); }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const openPicker = () => {
    const y = vYear || today.getFullYear();
    setViewYear(y);
    setDecadeStart(Math.floor(y / 12) * 12);
    setMode('months');
    setOpen(true);
  };

  const pickMonth = (mIdx) => {
    const mm = String(mIdx + 1).padStart(2, '0');
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
    setMode('months');
  };

  const pickYear = (y) => {
    setViewYear(y);
    setMode('months');
  };

  const display = vYear && vMonth ? `${MONTHS[vMonth - 1]} ${vYear}` : '';
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  return (
    <div className="pb-monthpicker" ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={`pb-input pb-monthpicker-trigger${!display ? ' pb-monthpicker-placeholder' : ''}`}
        onClick={() => (open ? (setOpen(false), setMode('months')) : openPicker())}
      >
        <span>{display || placeholder}</span>
        <svg className="pb-monthpicker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <div className="pb-monthpicker-pop" onClick={(e) => e.stopPropagation()}>
          {mode === 'months' ? (
            <>
              <div className="pb-monthpicker-header">
                <button type="button" className="pb-monthpicker-nav" aria-label="Previous year"
                  onClick={() => setViewYear(y => Math.max(minYear, y - 1))}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button type="button" className="pb-monthpicker-yearlabel"
                  onClick={() => { setDecadeStart(Math.floor(viewYear / 12) * 12); setMode('years'); }}>
                  {viewYear}
                </button>
                <button type="button" className="pb-monthpicker-nav" aria-label="Next year"
                  onClick={() => setViewYear(y => Math.min(maxYear, y + 1))}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="pb-monthpicker-grid">
                {MONTHS.map((m, idx) => (
                  <button
                    type="button"
                    key={m}
                    className={`pb-monthpicker-cell${vYear === viewYear && vMonth === idx + 1 ? ' pb-monthpicker-cell-active' : ''}`}
                    onClick={() => pickMonth(idx)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="pb-monthpicker-header">
                <button type="button" className="pb-monthpicker-nav" aria-label="Previous years"
                  onClick={() => setDecadeStart(d => Math.max(minYear, d - 12))}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="pb-monthpicker-yearlabel pb-monthpicker-yearlabel-static">{decadeStart} – {decadeStart + 11}</span>
                <button type="button" className="pb-monthpicker-nav" aria-label="Next years"
                  onClick={() => setDecadeStart(d => Math.min(maxYear, d + 12))}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="pb-monthpicker-grid pb-monthpicker-grid-years">
                {years.map(y => (
                  <button
                    type="button"
                    key={y}
                    disabled={y < minYear || y > maxYear}
                    className={`pb-monthpicker-cell${y === viewYear ? ' pb-monthpicker-cell-active' : ''}${(y < minYear || y > maxYear) ? ' pb-monthpicker-cell-disabled' : ''}`}
                    onClick={() => pickYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
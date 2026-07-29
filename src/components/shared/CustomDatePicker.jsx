import React, { useState, useRef, useEffect } from 'react';

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CustomDatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Track the month being viewed in the popup
  const [viewDate, setViewDate] = useState(value || new Date());
  
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const getDaysGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];
    
    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      grid.push({
        date: new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding to complete 42 cells (6 rows)
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return grid;
  };

  const handleSelectDate = (date) => {
    onChange(date);
    setViewDate(date);
    setIsOpen(false);
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const formatDate = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Input Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.85rem] font-medium transition-colors w-32 border justify-between
          ${isOpen 
            ? 'bg-[var(--card-inner-bg)] border-[var(--border-hover)] text-[var(--text-primary)] shadow-sm' 
            : 'bg-[var(--card-inner-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
          }`}
      >
        <span className="truncate">{formatDate(value)}</span>
        <span className="text-[var(--text-muted)] shrink-0"><IconCalendar /></span>
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 rounded-2xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 w-72 bg-[var(--bg-card)] border-[var(--border-card)]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
              <IconChevronLeft />
            </button>
            <span className="font-sans text-[0.95rem] font-bold text-[var(--text-primary)] tracking-wide">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
              <IconChevronRight />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center font-sans text-[0.7rem] font-bold text-[var(--text-muted)]">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysGrid().map((item, i) => {
              const selected = isSameDay(item.date, value);
              const isToday = isSameDay(item.date, new Date());
              return (
                <button
                  key={i}
                  onClick={() => handleSelectDate(item.date)}
                  className={`
                    w-8 h-8 mx-auto flex items-center justify-center rounded-lg font-sans text-[0.8rem] transition-all
                    ${!item.isCurrentMonth ? 'text-[var(--text-muted)] opacity-50 font-medium' : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}
                    ${isToday && !selected ? 'border border-[var(--border-subtle)] text-[var(--text-primary)]' : ''}
                    ${selected ? 'bg-[var(--accent-selected-bg)] text-[var(--accent-selected-text)] font-bold scale-105' : ''}
                  `}
                >
                  {item.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

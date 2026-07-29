import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationIcon } from './NotificationIcon';
import useTheme from '../../hooks/useTheme';

const CATEGORIES = ['All', 'Profile Activity', 'Job Applications', 'System', 'Achievements'];

/* ── Category metadata: label + icon ── */
const CAT_META = {
  'All':               { icon: '🔔', label: 'All Notifications' },
  'Profile Activity':  { icon: '👁️', label: 'Profile Activity'  },
  'Job Applications':  { icon: '💼', label: 'Job Applications'  },
  'System':            { icon: '⚙️', label: 'System'            },
  'Achievements':      { icon: '🏆', label: 'Achievements'      },
};

/* ── Per-type accent for the left unread bar & icon ── */
const colorMap = {
  indigo:  { bar: 'bg-indigo-500',  iconWrap: 'bg-indigo-500/15 border-indigo-500/30',  iconC: 'text-indigo-400',  iconWrapL: 'bg-indigo-50 border-indigo-200',   iconCL: 'text-indigo-600'  },
  emerald: { bar: 'bg-emerald-500', iconWrap: 'bg-emerald-500/15 border-emerald-500/30',iconC: 'text-emerald-400', iconWrapL: 'bg-emerald-50 border-emerald-200', iconCL: 'text-emerald-600' },
  orange:  { bar: 'bg-orange-500',  iconWrap: 'bg-orange-500/15 border-orange-500/30',  iconC: 'text-orange-400',  iconWrapL: 'bg-orange-50 border-orange-200',   iconCL: 'text-orange-600'  },
  cyan:    { bar: 'bg-cyan-400',    iconWrap: 'bg-cyan-500/15 border-cyan-500/30',      iconC: 'text-cyan-400',    iconWrapL: 'bg-cyan-50 border-cyan-200',       iconCL: 'text-cyan-700'    },
  yellow:  { bar: 'bg-yellow-400',  iconWrap: 'bg-yellow-500/15 border-yellow-400/30',  iconC: 'text-yellow-400',  iconWrapL: 'bg-yellow-50 border-yellow-200',   iconCL: 'text-yellow-700'  },
  purple:  { bar: 'bg-purple-500',  iconWrap: 'bg-purple-500/15 border-purple-500/30',  iconC: 'text-purple-400',  iconWrapL: 'bg-purple-50 border-purple-200',   iconCL: 'text-purple-600'  },
};

export default function NotificationPanel() {
  const {
    filteredNotifications,
    notifications,
    panelOpen,
    closePanel,
    markAllRead,
    markRead,
    activeCategory,
    setActiveCategory,
    unreadCount,
  } = useNotifications();
  const { isDark } = useTheme();
  const panelRef   = useRef(null);
  const filterRef  = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (filterOpen) setFilterOpen(false);
        else closePanel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closePanel, filterOpen]);

  /* Close filter dropdown on outside click */
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  /* Unread count per category for badges */
  const catUnread = (cat) =>
    cat === 'All'
      ? notifications.filter((n) => !n.read).length
      : notifications.filter((n) => !n.read && n.category === cat).length;

  /* ── Theme tokens ── */
  const D = isDark;

  const panelBg     = D ? 'bg-[#080d1a]'    : 'bg-[#f8fafc]';
  const headerBg    = D ? 'bg-[#0c1225]'    : 'bg-white';
  const borderCol   = D ? 'border-white/[0.07]' : 'border-gray-200';
  const titleC      = D ? 'text-white'       : 'text-gray-900';
  const subC        = D ? 'text-gray-500'    : 'text-gray-400';
  const mutedC      = D ? 'text-gray-600'    : 'text-gray-400';
  const accentC     = D ? 'text-cyan-400'    : 'text-indigo-600';
  const accentHov   = D ? 'hover:bg-cyan-500/10' : 'hover:bg-indigo-50';
  const backBtnCls  = D
    ? 'bg-white/[0.06] border border-white/[0.08] text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/15'
    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 shadow-sm';
  const filterBtnCls = D
    ? 'bg-white/[0.06] border border-white/[0.08] text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/15'
    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 shadow-sm';
  const filterBtnActive = D
    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400'
    : 'bg-indigo-50 border border-indigo-300 text-indigo-600';

  /* Filter dropdown */
  const dropdownBg  = D ? 'bg-[#101827] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
                        : 'bg-white border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)]';
  const dropItemDef = D ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  const dropItemAct = D ? 'bg-cyan-500/12 text-cyan-300 font-semibold'      : 'bg-indigo-50 text-indigo-700 font-semibold';

  /* Card item */
  const cardBg      = D ? 'bg-[#0e1528]'    : 'bg-white';
  const cardBord    = D ? 'border-white/[0.07]' : 'border-gray-100';
  const cardHov     = D ? 'hover:bg-[#131d35] hover:border-white/12' : 'hover:bg-gray-50 hover:border-gray-200';
  const notifTitleC = D ? 'text-gray-100'   : 'text-gray-900';
  const notifDetC   = D ? 'text-gray-400'   : 'text-gray-500';
  const notifTimeC  = D ? 'text-gray-600'   : 'text-gray-400';
  const badgeBg     = D
    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-[#080d1a]'
    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white';

  /* Empty / end state */
  const emptyBord   = D ? 'border-white/10' : 'border-gray-200';

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={closePanel}
        aria-hidden="true"
        style={{ pointerEvents: panelOpen ? 'all' : 'none' }}
        className={`fixed inset-0 z-[450] transition-all duration-300
          ${panelOpen ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-transparent pointer-events-none'}`}
      />

      {/* ── Slide-in Panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="All Notifications"
        className={`
          fixed top-0 right-0 bottom-0 z-[500]
          w-[460px] max-w-full flex flex-col
          ${panelBg}
          border-l ${borderCol}
          shadow-[-12px_0_60px_rgba(0,0,0,0.5)]
          transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          ${panelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ══ HEADER ══ */}
        <div className={`flex-shrink-0 ${headerBg} border-b ${borderCol}`}>
          {/* Top row */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            {/* Left: back + title */}
            <div className="flex items-center gap-3">
              <button
                onClick={closePanel}
                aria-label="Close"
                className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${backBtnCls}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <div>
                <h2 className={`text-[1.1rem] font-bold leading-none ${titleC}`}>Notifications</h2>
                <p className={`text-[0.72rem] mt-0.5 ${subC}`}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>

            {/* Right: mark all + filter */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className={`text-[0.75rem] font-semibold ${accentC} ${accentHov} px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer bg-transparent border-none`}
                >
                  Mark all read
                </button>
              )}

              {/* Filter button + dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  aria-label="Filter notifications"
                  className={`
                    w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer
                    transition-all duration-200 gap-1
                    ${filterOpen ? filterBtnActive : filterBtnCls}
                  `}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                </button>

                {/* ── Filter Dropdown ── */}
                {filterOpen && (
                  <div className={`
                    absolute top-[calc(100%+8px)] right-0 w-[230px] z-[600]
                    rounded-2xl overflow-hidden
                    ${dropdownBg}
                    animate-[notifDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)_both]
                  `}>
                    <div className={`px-3 py-2.5 border-b ${D ? 'border-white/[0.07]' : 'border-gray-100'}`}>
                      <p className={`text-[0.7rem] font-semibold uppercase tracking-wider ${D ? 'text-gray-500' : 'text-gray-400'}`}>Filter by</p>
                    </div>
                    <div className="py-1.5">
                      {CATEGORIES.map((cat) => {
                        const uc = catUnread(cat);
                        const isActive = activeCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setFilterOpen(false); }}
                            className={`
                              w-full flex items-center gap-3 px-3.5 py-2.5 text-left
                              text-[0.82rem] cursor-pointer transition-colors duration-150
                              border-none bg-transparent
                              ${isActive ? dropItemAct : dropItemDef}
                            `}
                          >
                            <span className="text-base leading-none w-5 text-center">{CAT_META[cat].icon}</span>
                            <span className="flex-1">{CAT_META[cat].label}</span>
                            {uc > 0 && (
                              <span className={`
                                min-w-[18px] h-[18px] px-1 rounded-full text-[0.65rem] font-bold
                                flex items-center justify-center
                                ${isActive
                                  ? (D ? 'bg-cyan-400/20 text-cyan-300' : 'bg-indigo-100 text-indigo-700')
                                  : (D ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500')}
                              `}>
                                {uc}
                              </span>
                            )}
                            {isActive && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter pill (when not "All") */}
          {activeCategory !== 'All' && (
            <div className="px-5 pb-3 flex items-center gap-2">
              <span className={`text-[0.71rem] ${subC}`}>Showing:</span>
              <span className={`inline-flex items-center gap-1.5 text-[0.72rem] font-semibold px-2.5 py-1 rounded-full
                ${D ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                {CAT_META[activeCategory].icon} {activeCategory}
                <button
                  onClick={() => setActiveCategory('All')}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none p-0 leading-none"
                  aria-label="Clear filter"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>

        {/* ══ NOTIFICATION LIST ══ */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className={`flex flex-col items-center justify-center gap-3 py-20 ${mutedC}`}>
              <div className={`w-16 h-16 rounded-2xl border-2 border-dashed ${emptyBord} flex items-center justify-center opacity-30`}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p className="text-[0.85rem] font-medium">No notifications in this category</p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((n) => {
                const cm = colorMap[n.color] ?? colorMap.indigo;
                const wrapCls  = D ? cm.iconWrap  : cm.iconWrapL;
                const iconCls  = D ? cm.iconC     : cm.iconCL;

                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => markRead(n.id)}
                    onKeyDown={(e) => e.key === 'Enter' && markRead(n.id)}
                    className={`
                      group relative flex items-start gap-3.5
                      rounded-2xl border px-4 py-3.5 cursor-pointer
                      transition-all duration-200 outline-none
                      ${cardBg} ${cardBord} ${cardHov}
                      ${!n.read ? 'shadow-[0_2px_12px_rgba(0,0,0,0.2)]' : ''}
                    `}
                  >
                    {/* Unread left accent bar */}
                    {!n.read && (
                      <span className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${cm.bar}`} />
                    )}

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center mt-0.5 ${wrapCls}`}>
                      <span className={iconCls}>
                        <NotificationIcon type={n.icon} />
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[0.855rem] font-semibold leading-[1.4] ${notifTitleC}`}>
                          {n.title}
                          {n.badgeText && (
                            <span className={`ml-1.5 inline-block text-[0.66rem] font-bold px-2 py-0.5 rounded-full align-middle ${badgeBg}`}>
                              {n.badgeText}
                            </span>
                          )}
                        </p>
                        {/* Time + unread dot */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 mt-0.5">
                          <span className={`text-[0.68rem] whitespace-nowrap ${notifTimeC}`}>{n.time}</span>
                          {!n.read && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cm.bar} shadow-[0_0_6px_rgba(239,68,68,0.5)]`} />
                          )}
                        </div>
                      </div>
                      {n.detail && (
                        <p className={`text-[0.78rem] leading-[1.55] mt-1 ${notifDetC}`}>{n.detail}</p>
                      )}
                    </div>

                    {/* Chevron (appears on hover) */}
                    <svg
                      width="13" height="13"
                      viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round"
                      className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-all duration-200 group-hover:translate-x-0.5 ${D ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                );
              })}

              {/* End of list */}
              <div className={`flex flex-col items-center justify-center gap-2 py-8 ${mutedC}`}>
                <div className={`w-10 h-10 rounded-full border-2 border-dashed ${emptyBord} flex items-center justify-center opacity-25`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <p className="text-[0.75rem]">You're all caught up</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

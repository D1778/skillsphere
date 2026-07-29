import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationIcon } from './NotificationIcon';
import useTheme from '../../hooks/useTheme';

/* ── Per-color Tailwind icon wrapper classes ── */
const iconStyle = {
  indigo:  { wrap: 'bg-indigo-500/15 border border-indigo-500/25',  icon: 'text-indigo-400' },
  emerald: { wrap: 'bg-emerald-500/15 border border-emerald-500/25', icon: 'text-emerald-400' },
  orange:  { wrap: 'bg-orange-500/15 border border-orange-500/25',  icon: 'text-orange-400' },
  cyan:    { wrap: 'bg-cyan-500/15 border border-cyan-500/25',      icon: 'text-cyan-400'   },
  yellow:  { wrap: 'bg-yellow-500/15 border border-yellow-400/25',  icon: 'text-yellow-400' },
  purple:  { wrap: 'bg-purple-500/15 border border-purple-500/25',  icon: 'text-purple-400' },
};

const iconStyleLight = {
  indigo:  { wrap: 'bg-indigo-50 border border-indigo-200',   icon: 'text-indigo-600' },
  emerald: { wrap: 'bg-emerald-50 border border-emerald-200', icon: 'text-emerald-600' },
  orange:  { wrap: 'bg-orange-50 border border-orange-200',   icon: 'text-orange-600' },
  cyan:    { wrap: 'bg-cyan-50 border border-cyan-200',       icon: 'text-cyan-700'   },
  yellow:  { wrap: 'bg-yellow-50 border border-yellow-200',   icon: 'text-yellow-700' },
  purple:  { wrap: 'bg-purple-50 border border-purple-200',   icon: 'text-purple-600' },
};

export default function NotificationDropdown() {
  const { notifications, dropdownOpen, closeDropdown, openPanel, markAllRead, unreadCount } =
    useNotifications();
  const { isDark } = useTheme();
  const ref = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen, closeDropdown]);

  if (!dropdownOpen) return null;

  const preview = notifications.slice(0, 5);
  const styles = isDark ? iconStyle : iconStyleLight;

  /* ── Theme-aware tokens ── */
  const bg      = isDark ? 'bg-[rgba(22,29,46,0.98)]' : 'bg-white';
  const border  = isDark ? 'border-white/10'           : 'border-black/8';
  const shadow  = isDark ? 'shadow-[0_20px_60px_rgba(0,0,0,0.55),0_4px_16px_rgba(0,0,0,0.35)]'
                         : 'shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]';
  const divider = isDark ? 'border-white/8'            : 'border-black/6';
  const titleC  = isDark ? 'text-white'                : 'text-gray-900';
  const accentC = isDark ? 'text-cyan-400'             : 'text-indigo-600';
  const itemHov = isDark ? 'hover:bg-white/4'          : 'hover:bg-gray-50';
  const timeC   = isDark ? 'text-gray-500'             : 'text-gray-400';
  const notifTC = isDark ? 'text-gray-200'             : 'text-gray-800';
  const footBg  = isDark ? 'bg-[rgba(255,255,255,0.02)]' : 'bg-gray-50/60';
  const btnBg   = isDark
    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/18 hover:border-cyan-400/50'
    : 'bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300';

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className={`
        absolute top-[calc(100%+10px)] right-0 w-[360px] z-[9999]
        rounded-2xl overflow-hidden
        border ${border} ${bg} ${shadow}
        animate-[notifDropIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]
        max-w-[calc(100vw-16px)]
      `}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3.5 border-b ${divider}`}>
        <span className={`flex-1 text-[0.95rem] font-semibold ${titleC}`}>Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className={`text-[0.76rem] font-medium ${accentC} bg-transparent border-none cursor-pointer px-1 py-0.5 rounded transition-opacity hover:opacity-70`}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[320px] overflow-y-auto">
        {preview.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${itemHov} ${!n.read ? (isDark ? 'bg-cyan-500/[0.03]' : 'bg-indigo-50/40') : ''}`}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${styles[n.color]?.wrap ?? styles.indigo.wrap}`}>
              <span className={styles[n.color]?.icon ?? styles.indigo.icon}>
                <NotificationIcon type={n.icon} />
              </span>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <p className={`text-[0.82rem] font-medium leading-[1.4] mb-0.5 line-clamp-2 ${notifTC}`}>
                {n.title}
              </p>
              <span className={`text-[0.71rem] ${timeC}`}>{n.time}</span>
            </div>

            {/* Unread dot */}
            {!n.read && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2.5 border-t ${divider} ${footBg}`}>
        <button
          onClick={() => openPanel()}
          className={`
            w-full flex items-center justify-center gap-1.5
            text-[0.82rem] font-semibold rounded-lg px-4 py-2.5
            transition-all duration-150 hover:-translate-y-px cursor-pointer
            ${btnBg}
          `}
        >
          View all notifications
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

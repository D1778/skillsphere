import React, { createContext, useContext, useState, useCallback } from 'react';

/* ─── Mock Notification Data ────────────────────────────────────── */
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'profile_view',
    category: 'Profile Activity',
    title: 'Priya Sharma viewed your profile',
    detail: 'She is a Product Designer at Microsoft',
    time: '2m ago',
    read: false,
    icon: 'eye',
    color: 'indigo',
  },
  {
    id: 2,
    type: 'application',
    category: 'Job Applications',
    title: 'Your application for Frontend Developer at TCS has been shortlisted!',
    detail: 'Great job! The recruiter will contact you soon.',
    time: '1h ago',
    read: false,
    icon: 'briefcase',
    color: 'emerald',
  },
  {
    id: 3,
    type: 'application',
    category: 'Job Applications',
    title: 'Your application for UI/UX Designer at Figma is under review.',
    detail: "We'll update you as soon as there is progress.",
    time: '3h ago',
    read: false,
    icon: 'clock',
    color: 'orange',
  },
  {
    id: 4,
    type: 'job_match',
    category: 'System',
    title: 'New job matches found for you',
    detail: 'We found 5 new jobs that match your profile and skills.',
    time: '5h ago',
    read: true,
    icon: 'search',
    color: 'cyan',
  },
  {
    id: 5,
    type: 'achievement',
    category: 'Achievements',
    title: 'Congratulations!',
    detail: 'You earned a new skill badge: React Expert',
    time: '1d ago',
    read: true,
    icon: 'star',
    color: 'yellow',
    badgeText: 'React Expert',
  },
  {
    id: 6,
    type: 'profile_view',
    category: 'Profile Activity',
    title: 'Rahul Verma viewed your profile',
    detail: 'He is a Software Engineer at Google',
    time: '2d ago',
    read: true,
    icon: 'person',
    color: 'purple',
  },
];

/* ─── Context ───────────────────────────────────────────────────── */
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const openPanel = useCallback(() => {
    setDropdownOpen(false);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setActiveCategory('All');
  }, []);
  const toggleDropdown = useCallback(() => setDropdownOpen((v) => !v), []);
  const closeDropdown = useCallback(() => setDropdownOpen(false), []);

  const filteredNotifications =
    activeCategory === 'All'
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        unreadCount,
        dropdownOpen,
        panelOpen,
        activeCategory,
        setActiveCategory,
        markAllRead,
        markRead,
        openPanel,
        closePanel,
        toggleDropdown,
        closeDropdown,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

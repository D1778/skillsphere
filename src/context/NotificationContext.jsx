import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
} from '../services/api';

/* ─── Context ───────────────────────────────────────────────────── */
const NotificationContext = createContext(null);

// How often to re-poll the backend for new notifications while the app
// is open. No websocket/socket.io in this project, so polling is the
// simplest way to keep the bell badge reasonably fresh without adding
// a new dependency.
const POLL_INTERVAL_MS = 30_000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { notifications: items, unreadCount: count } = await getNotifications({ limit: 50 });
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      // Silent — a failed background refresh shouldn't surface an error
      // banner; the bell just keeps showing whatever it last had.
    }
  }, [user]);

  /* Fetch on sign-in, clear on sign-out, and poll while signed in. */
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiMarkAllRead();
    } catch {
      fetchNotifications(); // reconcile with server if the call actually failed
    }
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
    try {
      await apiMarkRead(id);
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const openPanel = useCallback(() => {
    setDropdownOpen(false);
    setPanelOpen(true);
    fetchNotifications(); // grab anything new right when the user opens it
  }, [fetchNotifications]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setActiveCategory('All');
  }, []);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((v) => {
      if (!v) fetchNotifications();
      return !v;
    });
  }, [fetchNotifications]);

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
        refreshNotifications: fetchNotifications,
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
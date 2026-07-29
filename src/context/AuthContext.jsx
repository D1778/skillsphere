import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAccessToken, getMe } from '../services/api';

const AuthContext = createContext(null);

/* ══════════════════════════════════════════════════
   AuthProvider — single source of truth for the
   signed-in user, shared by every ProtectedRoute
   instead of each one re-fetching /me on its own.
══════════════════════════════════════════════════ */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = still loading
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) { setUser(null); setLoading(false); return null; }
    try {
      const u = await getMe();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
  return ctx;
}
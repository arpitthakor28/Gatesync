import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [authError, setAuthError] = useState(null);

  // Silent restore session on every fresh app load / page refresh
  // Because the rotating refresh token is in an httpOnly cookie, page refresh NEVER logs out
  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApi.refresh();
      setUser({
        id: res.userId,
        loginId: res.loginId,
        role: res.role,
        societyId: res.societyId || 'SOC-101',
        flatNumber: res.flatNumber,
        fullName: res.fullName,
        mustResetPassword: res.mustResetPassword
      });
      setAuthError(null);
    } catch (err) {
      // No active refresh token cookie or session expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('gatesync:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('gatesync:auth-expired', handleAuthExpired);
  }, [restoreSession]);

  const login = async (loginId, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login(loginId, password);
      const userData = {
        id: res.userId,
        loginId: res.loginId,
        role: res.role,
        societyId: res.societyId || 'SOC-101',
        flatNumber: res.flatNumber,
        fullName: res.fullName,
        mustResetPassword: res.mustResetPassword
      };
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid credentials';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout server call returned error:', e);
    } finally {
      setUser(null);
      setSessions([]);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await authApi.getSessions();
      setSessions(data);
      return data;
    } catch (e) {
      console.error('Failed to load user sessions', e);
      return [];
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await authApi.revokeSession(sessionId);
      await fetchSessions();
    } catch (e) {
      console.error('Failed to revoke session', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      societyId: user?.societyId || 'SOC-101',
      flatNumber: user?.flatNumber || null,
      isAuthenticated: !!user,
      loading,
      authError,
      login,
      logout,
      sessions,
      fetchSessions,
      revokeSession,
      restoreSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

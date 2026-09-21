'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AdminUser, AdminRole } from '@/types';
import { apiClient, getAdminToken, setAdminToken, clearAdminToken } from '@/lib/api-client';

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('验证请求超时')), 6000)
      );
      const data = await Promise.race([
        apiClient.get<AdminUser>('/api/admin/auth/me'),
        timeoutPromise,
      ]);
      setAdmin(data);
    } catch {
      clearAdminToken();
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; admin: AdminUser }>('/api/admin/auth/login', {
      email,
      password,
    });
    if (res.token) {
      setAdminToken(res.token);
    }
    setAdmin(res.admin);
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/admin/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAdminToken();
      setAdmin(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (roles: AdminRole[]): boolean => {
    if (!admin) return false;
    if (admin.role === 'owner' || admin.role === 'admin') return true; // Superadmin has all rights
    return roles.includes(admin.role);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

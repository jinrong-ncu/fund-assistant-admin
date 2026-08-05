import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Spin } from 'antd';

import { clearToken, fetchMe, getToken, login as loginRequest, logout as logoutRequest } from '@/services/api';
import type { AdminUser } from '@/types';

type AuthContextValue = {
  admin: AdminUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    const expire = () => setAdmin(null);
    window.addEventListener('admin:session-expired', expire);
    if (getToken()) {
      fetchMe()
        .then(setAdmin)
        .catch(() => clearToken())
        .finally(() => setReady(true));
    }
    return () => window.removeEventListener('admin:session-expired', expire);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    admin,
    ready,
    async login(email, password) {
      setAdmin(await loginRequest(email, password));
    },
    async logout() {
      await logoutRequest().catch(() => undefined);
      setAdmin(null);
    },
  }), [admin, ready]);

  if (!ready) return <div className="boot-screen"><Spin size="large" tip="正在验证登录状态" /></div>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

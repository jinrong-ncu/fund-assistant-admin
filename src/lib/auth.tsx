import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser, fetchMe, login as apiLogin, logout as apiLogout, getToken, clearToken } from '../services/api';
import { useAuthStore } from '../stores/auth-store';

export interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const admin = useAuthStore((state) => state.admin);
  const setAdmin = useAuthStore((state) => state.setAdmin);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    const handleSessionExpired = () => setAdmin(null);
    window.addEventListener('admin:session-expired', handleSessionExpired);
    fetchMe()
      .then(setAdmin)
      .catch(() => {
        clearToken();
        setAdmin(null);
      })
      .finally(() => setLoading(false));
    return () => window.removeEventListener('admin:session-expired', handleSessionExpired);
  }, []);

  async function login(email: string, password: string) {
    const user = await apiLogin(email, password);
    setAdmin(user);
  }

  async function logout() {
    await apiLogout();
    setAdmin(null);
  }

  const value: AuthContextType = {
    admin,
    isAuthenticated: !!admin,
    loading,
    login,
    logout,
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f5f7fb] text-[#66738a] font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2458c6] border-t-transparent rounded-full animate-spin"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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

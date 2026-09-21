'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { clearAdminToken } from '@/lib/api-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { admin, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      router.replace('/login');
    }
  }, [admin, loading, router]);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setAuthTimedOut(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
    setAuthTimedOut(false);
  }, [loading]);

  if (loading) {
    if (authTimedOut) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm p-6 rounded-lg border border-border bg-card shadow-sm">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">身份验证耗时过长</h3>
            <p className="text-xs text-muted-foreground">无法完成管理员权限校验，可能是登录态已失效或网络较慢</p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAuthTimedOut(false);
                  window.location.reload();
                }}
                className="text-xs"
              >
                重试刷新
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  clearAdminToken();
                  router.replace('/login');
                }}
                className="text-xs"
              >
                前往登录
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">正在验证管理员身份...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        className="hidden md:flex"
      />

      {/* Mobile Drawer Navigation */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 max-w-xs border-r">
          <AdminSidebar
            collapsed={false}
            onToggleCollapsed={() => {}}
            onNavigate={() => setMobileOpen(false)}
            className="w-full h-full border-0"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0">
        <AdminHeader onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

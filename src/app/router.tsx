import { Navigate, createHashRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { Suspense, lazy, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { AdminLayout } from '@/layouts/AdminLayout';
const AuditPage = lazy(() => import('@/pages/AuditPage'));
const ContentPage = lazy(() => import('@/pages/ContentPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const MarketConfigPage = lazy(() => import('@/pages/MarketConfigPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="page-loading"><Spin size="large" /></div>}>{children}</Suspense>;
}

function ProtectedLayout() {
  const { admin } = useAuth();
  return admin ? <AdminLayout /> : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { admin } = useAuth();
  return admin ? <Navigate to="/" replace /> : <Page><LoginPage /></Page>;
}

export const router = createHashRouter([
  { path: '/login', element: <LoginRoute /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Page><DashboardPage /></Page> },
      { path: 'users', element: <Page><UsersPage /></Page> },
      { path: 'feedback', element: <Page><FeedbackPage /></Page> },
      { path: 'content', element: <Page><ContentPage /></Page> },
      { path: 'market', element: <Page><MarketConfigPage /></Page> },
      { path: 'settings', element: <Page><SettingsPage /></Page> },
      { path: 'audit', element: <Page><AuditPage /></Page> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

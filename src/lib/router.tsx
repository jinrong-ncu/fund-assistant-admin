import { createHashHistory, createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AuthContextType } from './auth';
import { AdminLayout } from '../layouts/admin-layout';
import LoginPage from '../pages/login';
import DashboardPage from '../pages/dashboard';
import UsersPage from '../pages/users';
import FeedbackPage from '../pages/feedback';
import FundsPage from '../pages/funds/list';
import FundDetailPage from '../pages/funds/detail';
import ChangelogPage from '../pages/changelogs';
import ConfigPage from '../pages/configs';
import AuditPage from '../pages/audit';
import NotFoundPage from '../pages/not-found';

interface RouterContext {
  auth: AuthContextType;
}

// 1. Root Route
export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundPage />,
});

// 2. Login Route
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginPage,
});

// 3. Admin Layout Route
export const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_admin-layout',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AdminLayout,
});

// 4. Admin Children Routes
export const indexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

export const dashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

export const usersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/users',
  component: UsersPage,
});

export const feedbackRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/feedback',
  component: FeedbackPage,
});

export const fundsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/funds',
  component: FundsPage,
});

export const fundDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/funds/$fundCode',
  component: FundDetailPage,
});

export const changelogsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/changelogs',
  component: ChangelogPage,
});

export const configsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/configs',
  component: ConfigPage,
});

export const auditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/audit',
  component: AuditPage,
});

// 5. Build Route Tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  adminLayoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    usersRoute,
    feedbackRoute,
    fundsRoute,
    fundDetailRoute,
    changelogsRoute,
    configsRoute,
    auditRoute,
  ]),
]);

// 6. Create Router Instance
export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: {
    auth: undefined!, // Injected at runtime in Providers
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

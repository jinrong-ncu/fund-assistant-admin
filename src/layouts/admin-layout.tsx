import { Link, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import {
  Activity,
  BarChart3,
  BookOpen,
  FileClock,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const navItems = [
  { to: '/dashboard', label: '概览', icon: LayoutDashboard },
  { to: '/users', label: '用户', icon: Users },
  { to: '/feedback', label: '反馈', icon: MessageSquare },
  { to: '/funds', label: '热门基金', icon: Star },
  { to: '/changelogs', label: '更新日志', icon: BookOpen },
  { to: '/configs', label: '系统配置', icon: Settings },
  { to: '/audit', label: '审计', icon: FileClock },
] as const;

const pathMap: Record<string, string> = {
  '/dashboard': '概览',
  '/users': '用户管理',
  '/feedback': '反馈管理',
  '/funds': '热门基金',
  '/changelogs': '更新日志',
  '/configs': '系统配置',
  '/audit': '操作审计',
};

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const routerState = useRouterState();
  const navigate = useNavigate();

  const currentPath = routerState.location.pathname;
  // Dynamic page title matching nested paths as well (e.g. /funds/000001)
  const matchedKey = Object.keys(pathMap).find(key => currentPath.startsWith(key)) || '';
  const title = pathMap[matchedKey] || '概览';

  async function handleLogout() {
    try {
      await logout();
      navigate({ to: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div className="grid grid-cols-[248px_1fr] min-h-screen bg-[#f5f7fb]">
      {/* Sidebar */}
      <aside className="bg-[#172033] text-[#dce5f5] flex flex-col p-4.5 select-none">
        <div className="flex items-center gap-3 h-12 px-2.5 mb-6 font-bold text-white text-lg border-b border-white/10">
          <Activity size={24} className="text-primary-light" />
          <span>估值助手后台</span>
        </div>
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 h-11.5 px-3 rounded-md text-[#b8c3d8] bg-transparent border-0 hover:bg-[#26344f] hover:text-white transition-all text-left text-[15px] font-medium w-full cursor-pointer decoration-none"
                activeProps={{ className: 'flex items-center gap-3 h-11.5 px-3 rounded-md text-white bg-[#26344f] text-[15px] font-semibold border-0 text-left w-full cursor-pointer decoration-none !text-white' }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between h-14.5 px-6 bg-white border-b border-borderBase">
          <div className="text-sm font-medium text-textMuted">
            <span>后台</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-textMain font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            {admin && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-textMain">{admin.email}</span>
                <span className="px-2.5 py-0.75 text-xs font-semibold rounded-full bg-primary-light text-primary border border-primary-border/20">
                  {admin.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all"
              aria-label="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic page contents */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

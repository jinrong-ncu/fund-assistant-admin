import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Activity, BookOpen, FileClock, LayoutDashboard, LogOut, MessageSquare, Settings, Star, Users } from 'lucide-react';
import { Button, Avatar, Badge } from '../components/ui';
import { useAuth } from '../lib/auth';

const navItems = [
  { to: '/dashboard', label: '概览', icon: LayoutDashboard }, { to: '/users', label: '用户', icon: Users },
  { to: '/feedback', label: '反馈', icon: MessageSquare }, { to: '/funds', label: '热门基金', icon: Star },
  { to: '/changelogs', label: '更新日志', icon: BookOpen }, { to: '/configs', label: '系统配置', icon: Settings },
  { to: '/audit', label: '审计', icon: FileClock },
] as const;
const pathMap: Record<string, string> = { '/dashboard': '概览', '/users': '用户管理', '/feedback': '反馈管理', '/funds': '热门基金', '/changelogs': '更新日志', '/configs': '系统配置', '/audit': '操作审计' };

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const currentPath = useRouterState().location.pathname;
  const navigate = useNavigate();
  const title = pathMap[Object.keys(pathMap).find((key) => currentPath.startsWith(key)) || ''] || '概览';

  async function handleLogout() { await logout().catch(() => undefined); navigate({ to: '/login' }); }

  return <div className="flex min-h-screen bg-background"><aside className="hidden w-56 shrink-0 flex-col bg-[#172033] p-4 text-slate-200 md:flex">
    <div className="flex h-12 items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white"><Activity size={21} /></div><div><div className="font-extrabold leading-tight text-white">估值助手后台</div><div className="text-[11px] text-slate-400">Fund Assistant Admin</div></div></div>
    <div className="my-5 border-t border-white/10" />
    <nav className="grid gap-1.5">{navItems.map((item) => { const Icon = item.icon; const selected = currentPath.startsWith(item.to); return <Link key={item.to} to={item.to} className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${selected ? 'bg-[#26344f] text-white' : 'text-slate-400 hover:bg-[#26344f] hover:text-white'}`}><Icon size={19} />{item.label}</Link>; })}</nav>
  </aside><div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-borderBase bg-white/95 px-4 backdrop-blur md:px-7"><div className="text-sm"><span className="font-semibold text-textMuted">后台</span><span className="mx-2 text-slate-300">/</span><span className="font-extrabold text-textMain">{title}</span></div><div className="flex items-center gap-2.5">{admin && <><Avatar>{admin.email.slice(0, 1).toUpperCase()}</Avatar><span className="hidden text-sm font-bold text-textMain sm:inline">{admin.email}</span><Badge>{admin.role}</Badge></>}<Button variant="outline" className="h-10 w-10 px-0" onClick={handleLogout} aria-label="退出登录"><LogOut size={16} /></Button></div></header><nav className="flex gap-1 overflow-x-auto border-b border-borderBase bg-white px-3 py-2 md:hidden">{navItems.map((item) => { const Icon = item.icon; const selected = currentPath.startsWith(item.to); return <Link key={item.to} to={item.to} className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${selected ? 'bg-primary-light text-primary' : 'text-textMuted'}`}><Icon size={14} />{item.label}</Link>; })}</nav><main className="min-w-0 flex-1 px-3 py-5 sm:px-5 md:px-7 md:py-7"><div className="mx-auto w-full max-w-[1700px]"><Outlet /></div></main></div></div>;
}

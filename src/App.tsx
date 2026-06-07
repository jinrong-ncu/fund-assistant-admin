import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileClock,
  Flag,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AdminUser,
  adminRequest,
  clearToken,
  fetchMe,
  getToken,
  jsonPatch,
  login,
  logout,
} from './api';
import {
  AuditLog,
  Changelog,
  DashboardSummary,
  FeedbackRow,
  HotFund,
  SystemConfig,
  UserRow,
} from './types';

type PageKey =
  | 'dashboard'
  | 'users'
  | 'feedback'
  | 'hotFunds'
  | 'changelogs'
  | 'configs'
  | 'audit';

const navItems: Array<{ key: PageKey; label: string; icon: ReactNode }> = [
  { key: 'dashboard', label: '概览', icon: <LayoutDashboard size={18} /> },
  { key: 'users', label: '用户', icon: <Users size={18} /> },
  { key: 'feedback', label: '反馈', icon: <MessageSquare size={18} /> },
  { key: 'hotFunds', label: '热门基金', icon: <Star size={18} /> },
  { key: 'changelogs', label: '更新日志', icon: <BookOpen size={18} /> },
  { key: 'configs', label: '系统配置', icon: <Settings size={18} /> },
  { key: 'audit', label: '审计', icon: <FileClock size={18} /> },
];

function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    loader()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive) setError(err.message || '加载失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [...deps, tick]);

  return { data, loading, error, refresh: () => setTick((value) => value + 1) };
}

function LoginPage({ onLogin }: { onLogin: (admin: AdminUser) => void }) {
  const [email, setEmail] = useState('jinrong.liu@email.ncu.edu.cn');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      onLogin(await login(email, password));
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <Shield size={28} />
        </div>
        <h1>估值助手后台</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            邮箱
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            密码
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={loading}>
            {loading ? '登录中' : '登录'}
          </button>
        </form>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-icon">{icon}</div>
    </div>
  );
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button className="icon-button" onClick={onClick} aria-label="刷新">
      <RefreshCw size={16} className={loading ? 'spin' : ''} />
    </button>
  );
}

function StatusLine({ loading, error }: { loading?: boolean; error?: string }) {
  if (loading) return <div className="status-line">加载中...</div>;
  if (error) return <div className="status-line error">{error}</div>;
  return null;
}

function DashboardPage() {
  const { data, loading, error, refresh } = useAsyncData(
    () => adminRequest<DashboardSummary>('/api/admin/dashboard/summary'),
    []
  );

  return (
    <section>
      <PageHeader
        title="概览"
        description="当前后台运营与服务状态"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <StatusLine loading={loading} error={error} />
      <div className="metric-grid">
        <MetricCard label="用户总数" value={data?.users ?? '-'} icon={<Users size={20} />} />
        <MetricCard
          label="持仓用户"
          value={data?.holdingsUsers ?? '-'}
          icon={<BarChart3 size={20} />}
        />
        <MetricCard
          label="自选用户"
          value={data?.watchlistUsers ?? '-'}
          icon={<Star size={20} />}
        />
        <MetricCard
          label="未处理反馈"
          value={data?.feedback?.open ?? '-'}
          icon={<MessageSquare size={20} />}
        />
        <MetricCard
          label="热门基金"
          value={data?.hotFundsActive ?? '-'}
          icon={<ListChecks size={20} />}
        />
        <MetricCard
          label="提审开关"
          value={data?.showMarketIndices ? '完整模式' : '提审模式'}
          icon={<Flag size={20} />}
        />
      </div>
    </section>
  );
}

function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const { data, loading, error, refresh } = useAsyncData(
    () =>
      adminRequest<{ items: UserRow[]; total: number }>(
        `/api/admin/users${query ? `?keyword=${encodeURIComponent(query)}` : ''}`
      ),
    [query]
  );
  const [detail, setDetail] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!selected) {
      setDetail({});
      return;
    }
    Promise.all([
      adminRequest(`/api/admin/users/${selected.openid}/watchlist`),
      adminRequest(`/api/admin/users/${selected.openid}/holdings`),
      adminRequest(`/api/admin/users/${selected.openid}/transactions`),
      adminRequest(`/api/admin/users/${selected.openid}/feedback`),
    ]).then(([watchlist, holdings, transactions, feedback]) => {
      setDetail({ watchlist, holdings, transactions, feedback });
    });
  }, [selected]);

  return (
    <section>
      <PageHeader
        title="用户管理"
        description="按 openid 或昵称定位用户"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(keyword.trim());
        }}
      >
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="搜索 openid / 昵称"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button className="secondary-button">搜索</button>
      </form>
      <StatusLine loading={loading} error={error} />
      <div className="split-view">
        <Table
          columns={['用户', 'openid', '持仓', '自选', '反馈']}
          rows={(data?.items || []).map((user) => [
            <button className="link-button" onClick={() => setSelected(user)}>
              {user.nickname || '微信用户'}
            </button>,
            <code>{user.openid}</code>,
            user.holdingsCount ?? '-',
            user.watchlistCount ?? '-',
            user.feedbackCount ?? '-',
          ])}
        />
        <aside className="detail-panel">
          <h3>{selected ? selected.nickname || selected.openid : '用户详情'}</h3>
          {selected ? (
            <pre>{JSON.stringify(detail, null, 2)}</pre>
          ) : (
            <p className="muted">选择左侧用户查看自选、持仓、流水和反馈。</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function FeedbackPage() {
  const { data, loading, error, refresh } = useAsyncData(
    () => adminRequest<{ items: FeedbackRow[] }>('/api/admin/feedback'),
    []
  );

  async function updateFeedback(item: FeedbackRow, status: string) {
    await adminRequest(`/api/admin/feedback/${item.id}`, jsonPatch('PUT', { status }));
    refresh();
  }

  return (
    <section>
      <PageHeader
        title="反馈管理"
        description="处理小程序用户提交的问题和建议"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <StatusLine loading={loading} error={error} />
      <Table
        columns={['用户', '分类', '内容', '状态', '时间', '操作']}
        rows={(data?.items || []).map((item) => [
          item.nickname || item.openid,
          item.category,
          item.content,
          <span className="status-badge">{item.status || 'open'}</span>,
          formatDate(item.created_at),
          <div className="row-actions">
            <button onClick={() => updateFeedback(item, 'triaged')}>分流</button>
            <button onClick={() => updateFeedback(item, 'resolved')}>解决</button>
          </div>,
        ])}
      />
    </section>
  );
}

function HotFundsPage() {
  const { data, loading, error, refresh } = useAsyncData(
    () => adminRequest<HotFund[]>('/api/admin/hot-funds'),
    []
  );
  const [form, setForm] = useState({ fundCode: '', fundName: '', sortOrder: '0' });

  async function createFund(event: FormEvent) {
    event.preventDefault();
    await adminRequest(
      '/api/admin/hot-funds',
      jsonPatch('POST', { ...form, sortOrder: Number(form.sortOrder), reason: '后台新增热门基金' })
    );
    setForm({ fundCode: '', fundName: '', sortOrder: '0' });
    refresh();
  }

  async function toggleFund(item: HotFund) {
    await adminRequest(
      `/api/admin/hot-funds/${item.id}`,
      jsonPatch('PUT', {
        fundCode: item.fund_code,
        fundName: item.fund_name,
        sortOrder: item.sort_order,
        isActive: !item.is_active,
        reason: '后台切换热门基金状态',
      })
    );
    refresh();
  }

  return (
    <section>
      <PageHeader
        title="热门基金"
        description="维护搜索页推荐内容"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <form className="inline-form" onSubmit={createFund}>
        <input
          placeholder="基金代码"
          value={form.fundCode}
          onChange={(event) => setForm({ ...form, fundCode: event.target.value })}
        />
        <input
          placeholder="基金名称"
          value={form.fundName}
          onChange={(event) => setForm({ ...form, fundName: event.target.value })}
        />
        <input
          placeholder="排序"
          type="number"
          value={form.sortOrder}
          onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
        />
        <button className="primary-button">新增</button>
      </form>
      <StatusLine loading={loading} error={error} />
      <Table
        columns={['代码', '名称', '排序', '状态', '操作']}
        rows={(data || []).map((item) => [
          item.fund_code,
          item.fund_name,
          item.sort_order,
          item.is_active ? '启用' : '停用',
          <button onClick={() => toggleFund(item)}>{item.is_active ? '停用' : '启用'}</button>,
        ])}
      />
    </section>
  );
}

function ChangelogPage() {
  const { data, loading, error, refresh } = useAsyncData(
    () => adminRequest<Changelog[]>('/api/admin/changelogs'),
    []
  );

  return (
    <section>
      <PageHeader
        title="更新日志"
        description="查看和维护小程序版本内容"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <StatusLine loading={loading} error={error} />
      <Table
        columns={['版本', '日期', '最新', '条目数']}
        rows={(data || []).map((item) => [
          item.version,
          item.publish_date,
          item.is_latest ? <CheckCircle2 size={16} /> : '-',
          item.details?.length || 0,
        ])}
      />
    </section>
  );
}

function ConfigPage() {
  const { data, loading, error, refresh } = useAsyncData(
    () => adminRequest<SystemConfig[]>('/api/admin/configs'),
    []
  );

  async function toggleConfig(item: SystemConfig) {
    const nextValue = item.value === 'true' ? 'false' : 'true';
    await adminRequest(
      `/api/admin/configs/${item.key}`,
      jsonPatch('PUT', {
        value: nextValue,
        description: item.description,
        reason: `后台切换 ${item.key}`,
      })
    );
    refresh();
  }

  return (
    <section>
      <PageHeader
        title="系统配置"
        description="提审开关和全局配置"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <StatusLine loading={loading} error={error} />
      <Table
        columns={['配置', '值', '说明', '操作']}
        rows={(data || []).map((item) => [
          item.key,
          <code>{item.value}</code>,
          item.description || '-',
          <button onClick={() => toggleConfig(item)}>切换</button>,
        ])}
      />
    </section>
  );
}

function AuditPage() {
  const { data, loading, error, refresh } = useAsyncData(
    () => adminRequest<{ items: AuditLog[] }>('/api/admin/audit-logs'),
    []
  );

  return (
    <section>
      <PageHeader
        title="操作审计"
        description="查看后台关键写操作记录"
        action={<RefreshButton onClick={refresh} loading={loading} />}
      />
      <StatusLine loading={loading} error={error} />
      <Table
        columns={['动作', '对象', '目标', '原因', '时间']}
        rows={(data?.items || []).map((item) => [
          item.action,
          item.target_type,
          item.target_id || '-',
          item.reason || '-',
          formatDate(item.created_at),
        ])}
      />
    </section>
  );
}

function Table({ columns, rows }: { columns: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                暂无数据
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function Shell({ admin, onLogout }: { admin: AdminUser; onLogout: () => void }) {
  const [page, setPage] = useState<PageKey>('dashboard');
  const title = useMemo(() => navItems.find((item) => item.key === page)?.label || '', [page]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Activity size={22} />
          <span>估值助手后台</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={page === item.key ? 'active' : ''}
              onClick={() => setPage(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="content-shell">
        <header className="topbar">
          <div>
            <span className="crumb">后台 / {title}</span>
          </div>
          <div className="admin-chip">
            <span>{admin.email}</span>
            <small>{admin.role}</small>
            <button className="icon-button" onClick={onLogout} aria-label="退出">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <div className="page-content">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'users' && <UsersPage />}
          {page === 'feedback' && <FeedbackPage />}
          {page === 'hotFunds' && <HotFundsPage />}
          {page === 'changelogs' && <ChangelogPage />}
          {page === 'configs' && <ConfigPage />}
          {page === 'audit' && <AuditPage />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [booting, setBooting] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    fetchMe()
      .then(setAdmin)
      .catch(() => clearToken())
      .finally(() => setBooting(false));
  }, []);

  async function handleLogout() {
    await logout();
    setAdmin(null);
  }

  if (booting) return <div className="boot-screen">加载中...</div>;
  if (!admin) return <LoginPage onLogin={setAdmin} />;
  return <Shell admin={admin} onLogout={handleLogout} />;
}


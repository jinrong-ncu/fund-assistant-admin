import React from 'react';
import { Link } from '@tanstack/react-router';
import { BarChart3, Flag, ListChecks, MessageSquare, RefreshCw, Star, UserPlus, Users } from 'lucide-react';
import { useDashboardSummary } from '../hooks/queries';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardSummary();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">概览</h2>
          <p className="text-xs text-textMuted mt-1">当前后台运营与服务状态</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新数据"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载失败: {error?.message || '未知错误'}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          label="用户总数"
          value={isLoading ? '...' : data?.users ?? '-'}
          icon={<Users size={20} />}
        />
        <MetricCard
          label="今日新增"
          value={isLoading ? '...' : data?.newUsersToday ?? '-'}
          icon={<UserPlus size={20} />}
        />
        <MetricCard
          label="持仓用户"
          value={isLoading ? '...' : data?.holdingsUsers ?? '-'}
          icon={<BarChart3 size={20} />}
        />
        <MetricCard
          label="自选用户"
          value={isLoading ? '...' : data?.watchlistUsers ?? '-'}
          icon={<Star size={20} />}
        />
        <MetricCard
          label="未处理反馈"
          value={isLoading ? '...' : data?.feedback?.open ?? '-'}
          icon={<MessageSquare size={20} />}
        />
        <MetricCard
          label="热门基金"
          value={isLoading ? '...' : data?.hotFundsActive ?? '-'}
          icon={<ListChecks size={20} />}
        />
        <MetricCard
          label="安全模式"
          value={isLoading ? '...' : data?.personalSafeMode ? '已开启' : '已关闭'}
          icon={<Flag size={20} />}
          tone={isLoading ? 'default' : data?.personalSafeMode ? 'success' : 'muted'}
        />
      </div>

      <div className="rounded-xl border border-[#d9e2f2] bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-textMain">需要切换安全模式？</div>
          <div className="text-xs text-textMuted mt-1">
            前往系统配置页，直接开启或关闭“个人主体安全模式”。
          </div>
        </div>
        <Link
          to="/configs"
          className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
        >
          前往配置
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: 'default' | 'success' | 'muted';
}) {
  const toneClasses =
    tone === 'success'
      ? {
          card: 'border-emerald-200 bg-emerald-50/40',
          icon: 'bg-emerald-100 text-emerald-700',
        }
      : tone === 'muted'
        ? {
            card: 'border-slate-200 bg-slate-50/50',
            icon: 'bg-slate-100 text-slate-600',
          }
        : {
            card: 'border-borderBase bg-white',
            icon: 'bg-primary-light text-primary',
          };

  return (
    <div
      className={`border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between min-h-24 ${toneClasses.card}`}
    >
      <div>
        <span className="text-xs text-textMuted font-medium block">{label}</span>
        <strong className="text-2xl font-bold text-textMain block mt-2.5">{value}</strong>
      </div>
      <div
        className={`w-10.5 h-10.5 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 ${toneClasses.icon}`}
      >
        {icon}
      </div>
    </div>
  );
}

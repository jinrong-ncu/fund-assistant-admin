import React from 'react';
import { BarChart3, Flag, ListChecks, MessageSquare, RefreshCw, Star, Users } from 'lucide-react';
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
          className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
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
          label="提审开关"
          value={isLoading ? '...' : data?.showMarketIndices ? '完整模式' : '提审模式'}
          icon={<Flag size={20} />}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-borderBase rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between min-h-24">
      <div>
        <span className="text-xs text-textMuted font-medium block">{label}</span>
        <strong className="text-2xl font-bold text-textMain block mt-2.5">{value}</strong>
      </div>
      <div className="w-10.5 h-10.5 rounded-lg bg-primary-light text-primary flex items-center justify-center transition-transform duration-200 hover:scale-105">
        {icon}
      </div>
    </div>
  );
}

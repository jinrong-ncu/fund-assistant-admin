import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useChangelogs } from '../hooks/queries';
import { Changelog } from '../types';
import { DataTable } from '../components/DataTable';

export default function ChangelogPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useChangelogs();

  const columns: ColumnDef<Changelog>[] = [
    {
      header: '版本',
      accessorKey: 'version',
      cell: ({ getValue }) => <span className="font-semibold text-textMain">{getValue() as string}</span>,
    },
    {
      header: '日期',
      accessorKey: 'publish_date',
    },
    {
      header: '最新版本',
      accessorKey: 'is_latest',
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="text-green-600 inline-flex items-center gap-1.5 font-medium text-xs">
            <CheckCircle2 size={16} />
            <span>最新</span>
          </span>
        ) : (
          <span className="text-textMuted">-</span>
        ),
    },
    {
      header: '更新条目数',
      accessorFn: (row) => row.details?.length || 0,
      cell: ({ getValue }) => (
        <span className="px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-xs">
          {getValue() as number} 条更新
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">更新日志</h2>
          <p className="text-xs text-textMuted mt-1">查看和维护小程序版本内容</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新日志"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载更新日志失败: {error?.message || '未知错误'}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data || []}
        loading={isLoading || isFetching}
      />
    </div>
  );
}

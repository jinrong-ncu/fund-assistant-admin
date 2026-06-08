import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useAuditLogs } from '../hooks/queries';
import { AuditLog } from '../types';
import { DataTable } from '../components/DataTable';

export default function AuditPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAuditLogs();

  function formatDate(value?: string) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  const columns: ColumnDef<AuditLog>[] = [
    {
      header: '操作动作',
      accessorKey: 'action',
      cell: ({ getValue }) => <span className="font-semibold text-textMain">{getValue() as string}</span>,
    },
    {
      header: '操作对象类型',
      accessorKey: 'target_type',
      cell: ({ getValue }) => <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-mono">{getValue() as string}</span>,
    },
    {
      header: '对象 ID',
      accessorKey: 'target_id',
      cell: ({ getValue }) => <code className="text-[11px] text-[#3c4a64] font-mono select-all">{getValue() as string || '-'}</code>,
    },
    {
      header: '操作原因说明',
      accessorKey: 'reason',
      cell: ({ getValue }) => <span className="text-textMuted text-xs">{getValue() as string || '-'}</span>,
    },
    {
      header: '操作时间',
      accessorKey: 'created_at',
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">操作审计</h2>
          <p className="text-xs text-textMuted mt-1">查看后台关键写操作记录</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新审计日志"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载审计日志失败: {error?.message || '未知错误'}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading || isFetching}
      />
    </div>
  );
}

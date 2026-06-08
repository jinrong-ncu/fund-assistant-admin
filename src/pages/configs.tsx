import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useConfigs, useToggleConfig } from '../hooks/queries';
import { SystemConfig } from '../types';
import { DataTable } from '../components/DataTable';

export default function ConfigPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useConfigs();
  const toggleMutation = useToggleConfig();

  const columns: ColumnDef<SystemConfig>[] = [
    {
      header: '配置键名',
      accessorKey: 'key',
      cell: ({ getValue }) => <span className="font-semibold text-textMain">{getValue() as string}</span>,
    },
    {
      header: '当前配置值',
      accessorKey: 'value',
      cell: ({ getValue }) => (
        <code className="text-xs bg-gray-100 text-[#3c4a64] px-2 py-0.5 rounded font-mono select-all">
          {getValue() as string}
        </code>
      ),
    },
    {
      header: '配置说明',
      accessorKey: 'description',
      cell: ({ getValue }) => <span className="text-textMuted">{getValue() as string || '-'}</span>,
    },
    {
      header: '操作',
      cell: ({ row }) => (
        <button
          onClick={() => toggleMutation.mutate(row.original)}
          className="btn-secondary h-7 px-3 text-xs font-semibold cursor-pointer"
          disabled={toggleMutation.isPending}
        >
          切换状态
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">系统配置</h2>
          <p className="text-xs text-textMuted mt-1">提审开关和全局配置</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新配置"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载系统配置失败: {error?.message || '未知错误'}
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

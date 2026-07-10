import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useFeedbacks, useUpdateFeedback } from '../hooks/queries';
import { FeedbackRow } from '../types';
import { DataTable } from '../components/DataTable';

export default function FeedbackPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useFeedbacks();
  const updateFeedbackMutation = useUpdateFeedback();

  function formatDate(value?: string) {
    if (!value) return '-';
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  const columns: ColumnDef<FeedbackRow>[] = [
    {
      header: '用户',
      accessorFn: (row) => row.nickname || row.openid,
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    },
    {
      header: '分类',
      accessorKey: 'category',
      cell: ({ getValue }) => <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">{getValue() as string}</span>,
    },
    {
      header: '内容',
      accessorKey: 'content',
      cell: ({ getValue }) => <div className="max-w-xs md:max-w-md break-all text-gray-600 leading-normal">{getValue() as string}</div>,
    },
    {
      header: '状态',
      accessorKey: 'status',
      cell: ({ getValue }) => (
        <span className="badge-primary">
          {getValue() as string || 'open'}
        </span>
      ),
    },
    {
      header: '时间',
      accessorKey: 'created_at',
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
    {
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => updateFeedbackMutation.mutate({ id: row.original.id, status: 'triaged' })}
            className="btn-secondary h-10 px-3 text-sm"
            disabled={updateFeedbackMutation.isPending}
          >
            分流
          </button>
          <button
            onClick={() => updateFeedbackMutation.mutate({ id: row.original.id, status: 'resolved' })}
            className="btn-secondary h-10 px-3 text-sm"
            disabled={updateFeedbackMutation.isPending}
          >
            解决
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">反馈管理</h2>
          <p className="text-xs text-textMuted mt-1">处理小程序用户提交的问题和建议</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border border-[#d4dbea] text-[#34425b] hover:bg-gray-50 hover:border-[#b0bfd6] cursor-pointer transition-all active:scale-95"
          disabled={isLoading || isFetching}
          aria-label="刷新反馈"
        >
          <RefreshCw size={16} className={isLoading || isFetching ? 'animate-spin text-primary' : ''} />
        </button>
      </div>

      {/* Error Info */}
      {isError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">
          加载反馈列表失败: {error?.message || '未知错误'}
        </div>
      )}

      {/* Table Container */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading || isFetching}
      />
    </div>
  );
}

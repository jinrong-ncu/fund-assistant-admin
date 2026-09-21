'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { apiClient } from '@/lib/api-client';
import type { FeedbackRow, Paginated } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { DataTableToolbar } from '@/components/admin/DataTableToolbar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { FeedbackProcessDialog } from '@/features/feedback/FeedbackProcessDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/formatters';
import { MessageSquare, Wrench } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // URL States
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSizeParam = Number(searchParams.get('pageSize')) || 20;
  const statusParam = searchParams.get('status') || 'all';
  const priorityParam = searchParams.get('priority') || 'all';

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: pageParam - 1,
    pageSize: pageSizeParam,
  });
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRow | null>(null);

  const updateUrl = (page: number, pageSize: number, status: string, priority: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (pageSize !== 20) params.set('pageSize', String(pageSize));
    if (status !== 'all') params.set('status', status);
    if (priority !== 'all') params.set('priority', priority);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['feedback', pagination.pageIndex, pagination.pageSize, statusParam, priorityParam],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
      });
      if (statusParam !== 'all') params.set('status', statusParam);
      if (priorityParam !== 'all') params.set('priority', priorityParam);
      return apiClient.get<Paginated<FeedbackRow>>(`/api/admin/feedback?${params.toString()}`);
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      apiClient.put(`/api/admin/feedback/${selectedFeedback!.id}`, values),
    onSuccess: () => {
      setSelectedFeedback(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const columns: ColumnDef<FeedbackRow>[] = [
    {
      accessorKey: 'user',
      header: '用户',
      cell: ({ row }) => {
        const f = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage src={f.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {(f.nickname || '用').slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground">
              {f.nickname || '微信用户'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => (
        <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-foreground">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'content',
      header: '反馈内容',
      cell: ({ row }) => {
        const f = row.original;
        return (
          <div className="max-w-[280px] lg:max-w-md">
            <p className="truncate text-xs text-foreground" title={f.content}>
              {f.content}
            </p>
            {f.admin_note && (
              <p className="truncate text-[11px] text-muted-foreground mt-0.5" title={f.admin_note}>
                <span className="font-semibold text-foreground/80">备注:</span> {f.admin_note}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: '优先级',
      cell: ({ row }) => <StatusBadge status={row.original.priority} />,
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'created_at',
      header: '提交时间',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFeedback(row.original)}
          className="h-7 text-xs px-2.5"
        >
          <Wrench className="h-3.5 w-3.5 mr-1 text-primary" />
          处理工单
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="反馈处理"
        description="集中查看用户工单与产品建议，排定优先级并记录闭环处理备注"
      />

      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        total={data?.total}
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === 'function' ? updater(pagination) : updater;
          setPagination(next);
          updateUrl(next.pageIndex + 1, next.pageSize, statusParam, priorityParam);
        }}
        emptyTitle="暂无匹配的反馈工单"
        emptyDescription="当前没有找到符合筛选条件的反馈记录"
        toolbar={
          <DataTableToolbar
            filters={
              <div className="flex items-center gap-2">
                <Select
                  value={statusParam}
                  onValueChange={(val) => {
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    updateUrl(1, pagination.pageSize, val, priorityParam);
                  }}
                >
                  <SelectTrigger className="h-9 w-32 text-xs">
                    <SelectValue placeholder="处理状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="open">待处理</SelectItem>
                    <SelectItem value="processing">处理中</SelectItem>
                    <SelectItem value="resolved">已解决</SelectItem>
                    <SelectItem value="ignored">已忽略</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityParam}
                  onValueChange={(val) => {
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    updateUrl(1, pagination.pageSize, statusParam, val);
                  }}
                >
                  <SelectTrigger className="h-9 w-32 text-xs">
                    <SelectValue placeholder="优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部优先级</SelectItem>
                    <SelectItem value="low">低优先级</SelectItem>
                    <SelectItem value="normal">普通优先级</SelectItem>
                    <SelectItem value="high">高优先级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            onRefresh={() => refetch()}
            loading={isFetching}
          />
        }
      />

      {/* Process Feedback Dialog */}
      <FeedbackProcessDialog
        open={!!selectedFeedback}
        onOpenChange={(open) => !open && setSelectedFeedback(null)}
        feedback={selectedFeedback}
        loading={updateFeedbackMutation.isPending}
        onSubmit={async (values) => {
          await updateFeedbackMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}

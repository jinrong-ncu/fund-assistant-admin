'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { apiClient } from '@/lib/api-client';
import type { AuditLog, Paginated } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { CopyButton } from '@/components/admin/CopyButton';
import { JsonDiffViewer } from '@/components/admin/JsonDiffViewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/formatters';
import { Eye, RotateCw, ShieldAlert, FileSearch, Clock, UserCheck, Shield } from 'lucide-react';

const ACTION_MAP: Record<string, { label: string; color: string }> = {
  'config.upsert': { label: '修改系统配置', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  'auth.login': { label: '管理员登录', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  'transaction.update': { label: '修改流水', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  'transaction.delete': { label: '删除流水', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  'holding.recalculate': { label: '重算持仓', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' },
  'feedback.update': { label: '处理用户反馈', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  'hot_fund.create': { label: '新增热门内容', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  'hot_fund.update': { label: '修改热门内容', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  'hot_fund.delete': { label: '删除热门内容', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  'changelog.create': { label: '新增版本日志', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  'changelog.update': { label: '编辑版本日志', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  'changelog.delete': { label: '删除版本日志', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  'resource.create': { label: '新增资源位', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  'resource.update': { label: '修改资源位', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  'resource.delete': { label: '删除资源位', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  'market.layout.update': { label: '保存行情编排', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
  'market.stock.create': { label: '新增股票标的', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  'market.stock.refresh': { label: '刷新股票标的', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  'market.stock.delete': { label: '删除股票标的', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
};

export default function AuditPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSizeParam = Number(searchParams.get('pageSize')) || 20;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: pageParam - 1,
    pageSize: pageSizeParam,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<Paginated<AuditLog>>({
    queryKey: ['audit-logs', pagination.pageIndex + 1, pagination.pageSize],
    queryFn: () =>
      apiClient.get<Paginated<AuditLog>>(
        `/api/admin/audit-logs?page=${pagination.pageIndex + 1}&pageSize=${pagination.pageSize}`
      ),
  });

  const handlePaginationChange = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const nextState = typeof updater === 'function' ? updater(pagination) : updater;
    setPagination(nextState);

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextState.pageIndex + 1));
    params.set('pageSize', String(nextState.pageSize));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      header: '操作时间',
      cell: ({ row }) => (
        <span className="text-xs font-mono whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: '操作动作',
      cell: ({ row }) => {
        const action = row.original.action;
        const meta = ACTION_MAP[action] || { label: action, color: 'bg-muted text-muted-foreground border-border' };
        return (
          <Badge variant="outline" className={`text-xs px-2 py-0.5 border ${meta.color}`}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'target_type',
      header: '变更目标',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="font-semibold text-foreground">{row.original.target_type}</span>
          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={row.original.target_id || ''}>
            ID: {row.original.target_id || '-'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'reason',
      header: '操作原因',
      cell: ({ row }) => (
        <div className="max-w-xs md:max-w-sm truncate text-xs text-foreground font-medium" title={row.original.reason}>
          {row.original.reason || <span className="text-muted-foreground italic">无说明</span>}
        </div>
      ),
    },
    {
      accessorKey: 'ip',
      header: '客户端 IP',
      cell: ({ row }) => (
        <span className="text-[11px] font-mono text-muted-foreground">
          {row.original.ip || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row.original)}
          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="操作审计"
        description="系统写操作与状态变更轨迹监控，支持比对修改前后的结构化数据差异"
        breadcrumbs={[
          { title: '控制台', href: '/' },
          { title: '操作审计' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>刷新审计日志</span>
          </Button>
        }
      />

      {/* Audit Logs Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        total={data?.total || 0}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        emptyTitle="暂无操作审计日志"
        emptyDescription="当管理员在后台修改系统设置、流水、热门内容时，将自动记录操作快照。"
      />

      {/* Audit Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto space-y-6 p-6">
          <SheetHeader className="text-left space-y-2 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 border ${
                  selectedLog ? ACTION_MAP[selectedLog.action]?.color || 'bg-muted' : ''
                }`}
              >
                {selectedLog ? ACTION_MAP[selectedLog.action]?.label || selectedLog.action : ''}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {selectedLog && formatDateTime(selectedLog.created_at)}
              </span>
            </div>
            <SheetTitle className="text-lg font-bold">审计记录详情</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              日志 ID: <code className="bg-muted px-1 rounded">{selectedLog?.id}</code>
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Reason Highlight */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  操作原因 (Reason)
                </span>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {selectedLog.reason || '无记录原因'}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/20 p-3 rounded-lg border border-border/60">
                <div>
                  <span className="text-muted-foreground text-[11px] block">目标对象类型</span>
                  <span className="font-semibold text-foreground block mt-0.5 font-mono">
                    {selectedLog.target_type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">目标对象 ID</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-mono text-foreground truncate max-w-[120px]">
                      {selectedLog.target_id || '-'}
                    </span>
                    {selectedLog.target_id && <CopyButton text={selectedLog.target_id} />}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">操作客户端 IP</span>
                  <span className="font-mono text-foreground block mt-0.5">
                    {selectedLog.ip || '-'}
                  </span>
                </div>
              </div>

              {/* Data Diff Viewer */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground">数据修改前后对比 (Diff)</h4>
                <JsonDiffViewer before={selectedLog.before_data} after={selectedLog.after_data} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

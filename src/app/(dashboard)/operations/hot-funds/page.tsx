'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { HotFund } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmActionDialog } from '@/components/admin/ConfirmActionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, RotateCw, Edit2, Trash2, Flame } from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/admin/EmptyState';

export default function HotFundsPage() {
  const [editingFund, setEditingFund] = useState<HotFund | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [fundCode, setFundCode] = useState('');
  const [fundName, setFundName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const { data: funds, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['hot-funds'],
    queryFn: () => apiClient.get<HotFund[]>('/api/admin/hot-funds'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown> & { id?: number }) => {
      const { id, ...body } = data;
      if (id) {
        return apiClient.put(`/api/admin/hot-funds/${id}`, body);
      }
      return apiClient.post('/api/admin/hot-funds', body);
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/api/admin/hot-funds/${id}?reason=${encodeURIComponent('后台删除热门基金')}`),
    onSuccess: () => {
      setDeletingId(null);
      refetch();
    },
  });

  const openCreateDialog = () => {
    setEditingFund(null);
    setFundCode('');
    setFundName('');
    setSortOrder((funds?.length || 0) * 10);
    setIsActive(true);
    setReason('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (fund: HotFund) => {
    setEditingFund(fund);
    setFundCode(fund.fund_code);
    setFundName(fund.fund_name);
    setSortOrder(fund.sort_order);
    setIsActive(fund.is_active);
    setReason('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundCode.trim() || !fundName.trim()) {
      setFormError('基金代码和名称不能为空');
      return;
    }
    if (!reason.trim()) {
      setFormError('请输入操作原因用于审计追踪');
      return;
    }
    setFormError('');

    await saveMutation.mutateAsync({
      id: editingFund?.id,
      fund_code: fundCode.trim(),
      fund_name: fundName.trim(),
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="热门内容"
        description="管理小程序端向用户推荐的热门基金，支持即时权重排序与启用控制"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs h-9"
            >
              <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button size="sm" onClick={openCreateDialog} className="text-xs h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              新增热门基金
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold w-20">排序权重</th>
                  <th className="p-3 text-left font-semibold">基金代码</th>
                  <th className="p-3 text-left font-semibold">基金名称</th>
                  <th className="p-3 text-left font-semibold">展示状态</th>
                  <th className="p-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={5} className="p-4">
                        <div className="h-5 animate-pulse bg-muted rounded" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={5}>
                      <ErrorState
                        title="热门推荐加载失败"
                        description={(error as Error)?.message || '无法获取热门基金列表，请检查网络或稍后重试'}
                        onRetry={() => refetch()}
                      />
                    </td>
                  </tr>
                ) : !funds || funds.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<Flame className="h-9 w-9 text-amber-500/70" />}
                        title="暂无热门推荐基金"
                        description="当前尚未配置推荐基金标的，添加后将在小程序首页推荐位展示"
                        action={
                          <Button size="sm" onClick={openCreateDialog} className="text-xs">
                            <Plus className="h-4 w-4 mr-1.5" />
                            新增热门基金
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  funds.map((fund) => (
                    <tr key={fund.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono tabular-nums text-muted-foreground">
                        {fund.sort_order}
                      </td>
                      <td className="p-3 font-mono font-semibold text-foreground">
                        {fund.fund_code}
                      </td>
                      <td className="p-3 font-medium text-foreground">{fund.fund_name}</td>
                      <td className="p-3">
                        <StatusBadge
                          status={fund.is_active ? 'active' : 'inactive'}
                          label={fund.is_active ? '启用推荐' : '暂停展示'}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(fund)}
                            className="h-7 px-2 text-xs"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(fund.id)}
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Hot Fund Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingFund ? '编辑热门基金' : '新增热门推荐基金'}</DialogTitle>
              <DialogDescription className="text-xs">
                配置小程序热门卡片展示的基金标的与排序权重
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-destructive/10 text-destructive rounded border border-destructive/20 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fundCode" className="text-xs">
                    基金代码 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fundCode"
                    placeholder="如 005827"
                    value={fundCode}
                    onChange={(e) => setFundCode(e.target.value.trim())}
                    className="h-8 text-xs font-mono"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sortOrder" className="text-xs">
                    排序权重 (越小越靠前)
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                    className="h-8 text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fundName" className="text-xs">
                  基金名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fundName"
                  placeholder="如 易方达蓝筹精选混合"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-xs font-medium cursor-pointer">
                    启用展示
                  </Label>
                  <p className="text-[11px] text-muted-foreground">控制是否在小程序端对外展示</p>
                </div>
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs">
                  变更原因 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reason"
                  placeholder="请输入变更原因（用于操作审计日志）"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={saveMutation.isPending}
              >
                取消
              </Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? '正在保存...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="确认删除该热门推荐基金？"
        description="删除后小程序端将不再向用户推荐该标的。"
        destructive
        confirmLabel="确认删除"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingId) await deleteMutation.mutateAsync(deletingId);
        }}
      />
    </div>
  );
}

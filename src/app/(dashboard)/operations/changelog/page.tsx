'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Changelog } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmActionDialog } from '@/components/admin/ConfirmActionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, RotateCw, Edit2, Trash2, GitCommitHorizontal, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { EmptyState, ErrorState } from '@/components/admin/EmptyState';

export default function ChangelogPage() {
  const [editingChangelog, setEditingChangelog] = useState<Changelog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [version, setVersion] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [isLatest, setIsLatest] = useState(false);
  const [detailsText, setDetailsText] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const { data: changelogs, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['changelogs'],
    queryFn: () => apiClient.get<Changelog[]>('/api/admin/changelogs'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (data.id) {
        return apiClient.put('/api/admin/changelogs', data);
      }
      return apiClient.post('/api/admin/changelogs', data);
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/api/admin/changelogs?id=${id}&reason=${encodeURIComponent('后台删除版本更新日志')}`),
    onSuccess: () => {
      setDeletingId(null);
      refetch();
    },
  });

  const openCreateDialog = () => {
    setEditingChangelog(null);
    setVersion('v1.');
    setPublishDate(new Date().toISOString().slice(0, 10));
    setIsLatest(false);
    setDetailsText('');
    setReason('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Changelog) => {
    setEditingChangelog(item);
    setVersion(item.version);
    setPublishDate(item.publish_date);
    setIsLatest(item.is_latest);
    setDetailsText(item.details.map((d) => d.content).join('\n'));
    setReason('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !publishDate) {
      setFormError('版本号和发布日期不能为空');
      return;
    }

    const lines = detailsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setFormError('至少需要输入一行更新内容');
      return;
    }

    if (!reason.trim()) {
      setFormError('请输入变更原因用于操作审计');
      return;
    }

    setFormError('');

    await saveMutation.mutateAsync({
      id: editingChangelog?.id,
      version: version.trim(),
      publish_date: publishDate,
      is_latest: isLatest,
      details: lines.map((content) => ({ type: 'feature', content })),
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="版本日志"
        description="管理小程序历史版本更新动态与新特性列表，服务端保障同一时间最多仅有一个最新版本"
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
              发布新版本
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
                  <th className="p-3 text-left font-semibold w-28">版本号</th>
                  <th className="p-3 text-left font-semibold w-28">发布日期</th>
                  <th className="p-3 text-left font-semibold w-24">状态</th>
                  <th className="p-3 text-left font-semibold">更新内容详情</th>
                  <th className="p-3 text-right font-semibold w-28">操作</th>
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
                        title="版本日志加载失败"
                        description={(error as Error)?.message || '无法获取版本日志列表，请检查网络或稍后重试'}
                        onRetry={() => refetch()}
                      />
                    </td>
                  </tr>
                ) : !changelogs || changelogs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<GitCommitHorizontal className="h-9 w-9 text-muted-foreground" />}
                        title="暂无版本日志"
                        description="当前尚未发布任何版本更新动态，发布后将在小程序端版本记录中展现"
                        action={
                          <Button size="sm" onClick={openCreateDialog} className="text-xs">
                            <Plus className="h-4 w-4 mr-1.5" />
                            发布新版本
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  changelogs.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {item.version}
                      </td>
                      <td className="p-3 tabular-nums text-muted-foreground">
                        {formatDate(item.publish_date)}
                      </td>
                      <td className="p-3">
                        {item.is_latest ? (
                          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[11px] font-normal">
                            最新发布
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <ul className="list-disc list-inside space-y-0.5 text-foreground">
                          {item.details.map((d, i) => (
                            <li key={i} className="leading-relaxed">
                              {d.content}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="h-7 px-2 text-xs"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(item.id)}
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

      {/* Save Changelog Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingChangelog ? '编辑版本日志' : '发布新版本日志'}</DialogTitle>
              <DialogDescription className="text-xs">
                更新记录将同步展示在小程序端的更新公告中
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
                  <Label htmlFor="version" className="text-xs">
                    版本号 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="version"
                    placeholder="例如 v1.6.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value.trim())}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="publishDate" className="text-xs">
                    发布日期 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="h-8 text-xs tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isLatest" className="text-xs font-medium cursor-pointer">
                    设为当前最新版本
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    开启后，系统在数据库事务内会自动将其他旧版本置为非最新
                  </p>
                </div>
                <Switch id="isLatest" checked={isLatest} onCheckedChange={setIsLatest} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="detailsText" className="text-xs">
                    更新内容特性列表 <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">每行录入一条更新特性</span>
                </div>
                <Textarea
                  id="detailsText"
                  rows={5}
                  placeholder={`新增：自选基金实时估值推送通知\n优化：持仓明细页滑动交互与图表渲染性能\n修复：个别基金分红数据汇总计算异常`}
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  className="text-xs font-sans leading-relaxed"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs">
                  变更原因 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reason"
                  placeholder="请输入操作原因（写入操作审计日志）"
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
                {saveMutation.isPending ? '正在保存...' : '保存版本'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmActionDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="确认删除该版本日志？"
        description="删除后将立即从历史版本列表中移除。"
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

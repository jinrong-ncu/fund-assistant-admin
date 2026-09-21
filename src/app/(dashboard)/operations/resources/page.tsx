'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { apiClient } from '@/lib/api-client';
import type { ResourceEntry } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { ConfirmActionDialog } from '@/components/admin/ConfirmActionDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  RotateCw,
  Plus,
  Compass,
  Edit2,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ResourceFormValues {
  category: 'community' | 'support';
  channel: string;
  title: string;
  description: string;
  imageUrl: string;
  actionType: 'preview_image' | 'copy_text' | 'navigate';
  actionValue: string;
  enabled: boolean;
  sortOrder: number;
}

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / Create Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceEntry | null>(null);
  const [formData, setFormData] = useState<ResourceFormValues>({
    category: 'community',
    channel: '',
    title: '',
    description: '',
    imageUrl: '',
    actionType: 'preview_image',
    actionValue: '',
    enabled: true,
    sortOrder: 0,
  });

  // Delete Dialog State
  const [deleteItem, setDeleteItem] = useState<ResourceEntry | null>(null);

  const { data: resources = [], isLoading, isFetching, refetch } = useQuery<ResourceEntry[]>({
    queryKey: ['resources'],
    queryFn: () => apiClient.get<ResourceEntry[]>('/api/admin/resources'),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ResourceFormValues) => {
      const body = {
        category: payload.category,
        channel: payload.channel.trim(),
        title: payload.title.trim(),
        description: payload.description.trim() || null,
        imageUrl: payload.imageUrl.trim() || null,
        actionType: payload.actionType,
        actionValue: payload.actionValue.trim() || null,
        enabled: payload.enabled,
        sortOrder: Number(payload.sortOrder) || 0,
        reason: editingItem ? '后台编辑资源位' : '后台新增资源位',
      };

      if (editingItem) {
        return apiClient.put(`/api/admin/resources/${editingItem.id}`, body);
      }
      return apiClient.post('/api/admin/resources', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setDialogOpen(false);
      setEditingItem(null);
      setFeedbackMsg({
        type: 'success',
        message: editingItem ? '资源位修改已保存！' : '新资源位添加成功！',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: unknown) => {
      setFeedbackMsg({
        type: 'error',
        message: err instanceof Error ? err.message : '保存失败，请检查填写内容',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setDeleteItem(null);
      setFeedbackMsg({ type: 'success', message: '资源位已成功删除！' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: unknown) => {
      setFeedbackMsg({
        type: 'error',
        message: err instanceof Error ? err.message : '删除失败',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (item: ResourceEntry) =>
      apiClient.put(`/api/admin/resources/${item.id}`, {
        ...item,
        enabled: !item.enabled,
        reason: `后台切换资源位【${item.title}】状态`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      category: 'community',
      channel: 'wechat_group',
      title: '',
      description: '',
      imageUrl: '',
      actionType: 'preview_image',
      actionValue: '',
      enabled: true,
      sortOrder: 0,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: ResourceEntry) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      channel: item.channel,
      title: item.title,
      description: item.description || '',
      imageUrl: item.image_url || '',
      actionType: item.action_type || 'preview_image',
      actionValue: item.action_value || '',
      enabled: item.enabled,
      sortOrder: item.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.channel.trim()) return;
    saveMutation.mutate(formData);
  };

  const columns: ColumnDef<ResourceEntry>[] = [
    {
      accessorKey: 'sort_order',
      header: '排序',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-bold text-muted-foreground">
          #{row.original.sort_order}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: '分类',
      cell: ({ row }) => {
        const isCommunity = row.original.category === 'community';
        return (
          <Badge
            variant="outline"
            className={
              isCommunity
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                : 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400'
            }
          >
            {isCommunity ? '交流群聊' : '支持作者'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'title',
      header: '标题与渠道',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">{row.original.title}</span>
          <span className="text-[11px] font-mono text-muted-foreground">{row.original.channel}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: '描述说明',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-xs block" title={row.original.description || ''}>
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'image_url',
      header: '图片资源',
      cell: ({ row }) => {
        const url = row.original.image_url;
        if (!url) return <span className="text-xs text-muted-foreground">-</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>查看图片</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      },
    },
    {
      accessorKey: 'action_type',
      header: '交互动作',
      cell: ({ row }) => {
        const typeMap: Record<string, string> = {
          preview_image: '预览图片',
          copy_text: '复制文本',
          navigate: '页面跳转',
        };
        return (
          <span className="text-xs text-foreground font-mono">
            {typeMap[row.original.action_type] || row.original.action_type}
          </span>
        );
      },
    },
    {
      accessorKey: 'enabled',
      header: '状态',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.enabled}
            onCheckedChange={() => toggleStatusMutation.mutate(row.original)}
            disabled={toggleStatusMutation.isPending}
          />
          <span className={`text-xs font-medium ${row.original.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {row.original.enabled ? '启用' : '停用'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row.original)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteItem(row.original)}
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="交流与支持资源"
        description="管理小程序个人中心展示的交流群二维码、打赏支持赞赏码及外部跳转资源位"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
              <span>刷新</span>
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>新增资源</span>
            </Button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border text-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedbackMsg.message}</span>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={resources}
        loading={isLoading}
        emptyTitle="暂无交流与支持资源"
        emptyDescription="点击右上角「新增资源」添加群聊或支持打赏条目。"
      />

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitForm}>
            <DialogHeader>
              <DialogTitle>{editingItem ? '编辑资源位' : '新增资源位'}</DialogTitle>
              <DialogDescription className="text-xs">
                配置小程序“我的”页面交流与支持栏目的展示卡片与点击行为。
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">资源分类</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val as 'community' | 'support' })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community">交流群聊 (Community)</SelectItem>
                      <SelectItem value="support">支持作者 (Support)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">渠道标识 (Channel)</Label>
                  <Input
                    placeholder="如 wechat_group"
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">标题</Label>
                <Input
                  placeholder="如 使用交流"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">描述说明</Label>
                <Input
                  placeholder="如 获取帮助与最新功能信息"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">图片公开 URL</Label>
                <Input
                  placeholder="https://pub-...r2.dev/common/group_01.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">交互动作</Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(val) => setFormData({ ...formData, actionType: val as any })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preview_image">预览大图二维码</SelectItem>
                      <SelectItem value="copy_text">复制文本/微信号</SelectItem>
                      <SelectItem value="navigate">页面跳转</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">动作参数值 (可选)</Label>
                  <Input
                    placeholder="如待复制的微信号"
                    value={formData.actionValue}
                    onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">排序权重 (越大越靠前)</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 0 })}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <Switch
                    id="resource-enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label htmlFor="resource-enabled" className="text-xs cursor-pointer">
                    启用该资源
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? '正在保存...' : '保存资源'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmActionDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="确认删除该资源位？"
        description={`删除【${deleteItem?.title}】后，小程序端将不再展示此项交流或支持通道。`}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteItem) deleteMutation.mutate(deleteItem.id);
        }}
      />
    </div>
  );
}

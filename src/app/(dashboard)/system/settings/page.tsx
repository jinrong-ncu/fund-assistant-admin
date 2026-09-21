'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SystemConfig } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { CopyButton } from '@/components/admin/CopyButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RotateCw,
  Search,
  Sliders,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  Edit2,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ConfigMeta {
  label: string;
  category: 'core' | 'ads' | 'resources' | 'other';
  help: string;
  type: 'boolean' | 'text' | 'number';
  warning?: string;
  badge?: string;
}

const CONFIG_METAS: Record<string, ConfigMeta> = {
  review_mode: {
    label: '小程序提审模式',
    category: 'core',
    help: '开启后强制隐藏敏感与新增入口并关闭搜索，提审微信审核时必备',
    type: 'boolean',
    warning: '开启后将直接影响线上真实用户的使用功能，审核通过后请及时关闭！',
    badge: '关键提审',
  },
  market_review_mode: {
    label: '行情页审核开关',
    category: 'core',
    help: '开启后行情页面仅展示中性空态占位并停止实时行情网络请求',
    type: 'boolean',
    warning: '开启将导致行情页无法查看实时股票与指数数据。',
    badge: '关键提审',
  },
  show_market_indices: {
    label: '大盘行情指数组件',
    category: 'core',
    help: '控制持仓与自选页面顶部是否展示上证、深证、创业板等大盘行情走势',
    type: 'boolean',
  },
  personal_safe_mode: {
    label: '个人主体安全模式',
    category: 'core',
    help: '开启后前端全局降级为极简中性工具界面与合规字段文案',
    type: 'boolean',
  },
  ocr_enabled: {
    label: '截图 OCR 识别',
    category: 'core',
    help: '控制小程序端是否开放截屏/账单图片 OCR 智能解析记账功能',
    type: 'boolean',
  },
  ads_enabled: {
    label: '广告入口总开关',
    category: 'ads',
    help: '是否在小程序各页面中启用原生模板广告与激励视频入口',
    type: 'boolean',
  },
  support_entry_enabled: {
    label: '交流与支持入口',
    category: 'resources',
    help: '控制“我的”页面中群聊交流、支持作者打赏与反馈专区展示',
    type: 'boolean',
  },
  image_recognition_daily_free_limit: {
    label: '每日免费识别次数',
    category: 'core',
    help: '每个用户账号自然日内可免费使用的截图 OCR 次数上限',
    type: 'number',
  },
  community_qr_code: {
    label: '交流社群二维码',
    category: 'resources',
    help: '小程序用户扫码加入微信交流群的图片公开访问 URL',
    type: 'text',
  },
  support_qr_code: {
    label: '赞赏打赏二维码',
    category: 'resources',
    help: '支持作者微信赞赏码公开图片地址',
    type: 'text',
  },
  native_ad_unit_id_market: {
    label: '行情页原生广告 ID',
    category: 'ads',
    help: '微信开放平台分配的行情页底部广告位 ID',
    type: 'text',
  },
  native_ad_unit_id_detail: {
    label: '详情页原生广告 ID',
    category: 'ads',
    help: '基金/股票详情页底部广告位 ID',
    type: 'text',
  },
  native_ad_unit_id_watchlist: {
    label: '清单页原生广告 ID',
    category: 'ads',
    help: '自选基金清单页底部广告位 ID',
    type: 'text',
  },
  native_ad_unit_id_records: {
    label: '记录页原生广告 ID',
    category: 'ads',
    help: '金额流水记录页底部广告位 ID',
    type: 'text',
  },
  native_ad_unit_id_profile: {
    label: '我的页面原生广告 ID',
    category: 'ads',
    help: '个人中心页面底部广告位 ID',
    type: 'text',
  },
  rewarded_video_ad_unit_id_support: {
    label: '支持作者激励视频 ID',
    category: 'ads',
    help: '用户点击观看广告支持作者的激励视频广告位 ID',
    type: 'text',
  },
  rewarded_video_ad_unit_id_unlock: {
    label: '今日清爽激励视频 ID',
    category: 'ads',
    help: '观看后免除当日广告的激励视频广告位 ID',
    type: 'text',
  },
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reason dialog state for toggle or text update
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    key: string;
    value: string;
    description?: string | null;
    title: string;
    warning?: string;
  } | null>(null);

  // Text edit dialog state
  const [textEditItem, setTextEditItem] = useState<{
    key: string;
    value: string;
    description?: string | null;
    label: string;
  } | null>(null);
  const [textEditValue, setTextEditValue] = useState('');

  const { data: configs = [], isLoading, isFetching, refetch } = useQuery<SystemConfig[]>({
    queryKey: ['configs'],
    queryFn: () => apiClient.get<SystemConfig[]>('/api/admin/configs'),
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      key,
      value,
      reason,
      description,
    }: {
      key: string;
      value: string;
      reason: string;
      description?: string | null;
    }) => {
      return apiClient.put(`/api/admin/configs/${encodeURIComponent(key)}`, {
        value,
        reason,
        description: description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      setReasonDialogOpen(false);
      setTextEditItem(null);
      setPendingUpdate(null);
      setFeedbackMsg({ type: 'success', message: '配置修改成功并已记录审计日志！' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: unknown) => {
      setFeedbackMsg({
        type: 'error',
        message: err instanceof Error ? err.message : '保存配置失败，请检查网络或权限',
      });
    },
  });

  // Filtered configs
  const filteredConfigs = useMemo(() => {
    return configs.filter((item) => {
      const meta = CONFIG_METAS[item.key];
      const matchesSearch =
        !search.trim() ||
        item.key.toLowerCase().includes(search.toLowerCase()) ||
        item.value.toLowerCase().includes(search.toLowerCase()) ||
        (meta?.label && meta.label.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'core') return meta?.category === 'core';
      if (activeTab === 'ads') return meta?.category === 'ads';
      if (activeTab === 'resources') return meta?.category === 'resources';
      if (activeTab === 'other') return !meta || meta.category === 'other';

      return true;
    });
  }, [configs, search, activeTab]);

  // Handle Switch Toggle
  const handleToggle = (item: SystemConfig) => {
    const meta = CONFIG_METAS[item.key];
    const isCurrentlyTrue = item.value === 'true';
    const nextValue = isCurrentlyTrue ? 'false' : 'true';
    const actionLabel = nextValue === 'true' ? '开启' : '关闭';

    setPendingUpdate({
      key: item.key,
      value: nextValue,
      description: item.description,
      title: `确认${actionLabel}【${meta?.label || item.key}】？`,
      warning: meta?.warning,
    });
    setReasonDialogOpen(true);
  };

  // Handle Text Edit Open
  const handleOpenTextEdit = (item: SystemConfig) => {
    const meta = CONFIG_METAS[item.key];
    setTextEditItem({
      key: item.key,
      value: item.value,
      description: item.description,
      label: meta?.label || item.key,
    });
    setTextEditValue(item.value);
  };

  // Submit Text Edit
  const handleConfirmTextEdit = () => {
    if (!textEditItem) return;
    setPendingUpdate({
      key: textEditItem.key,
      value: textEditValue.trim(),
      description: textEditItem.description,
      title: `确认修改【${textEditItem.label}】？`,
    });
    setReasonDialogOpen(true);
  };

  // Submit Reason & Save
  const handleConfirmReason = (reason: string) => {
    if (!pendingUpdate) return;
    saveMutation.mutate({
      key: pendingUpdate.key,
      value: pendingUpdate.value,
      description: pendingUpdate.description,
      reason,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="管理小程序核心功能开关、微信提审模式及全局运行参数，所有写操作将自动记录审计"
        breadcrumbs={[
          { title: '控制台', href: '/' },
          { title: '系统设置' },
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
            <span>刷新配置</span>
          </Button>
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

      {/* Toolbar: Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              全部配置 ({configs.length})
            </TabsTrigger>
            <TabsTrigger value="core" className="text-xs px-3">
              核心开关
            </TabsTrigger>
            <TabsTrigger value="ads" className="text-xs px-3">
              广告配置
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs px-3">
              支持与社群
            </TabsTrigger>
            <TabsTrigger value="other" className="text-xs px-3">
              其他
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索配置键名、说明或当前值..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Config Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/40 h-28 border border-border/60" />
          ))
        ) : filteredConfigs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-muted-foreground bg-card rounded-lg border border-dashed border-border">
            <Sliders className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <span>没有找到匹配的系统配置项</span>
          </div>
        ) : (
          filteredConfigs.map((item) => {
            const meta = CONFIG_METAS[item.key];
            const isBoolean = meta?.type === 'boolean' || item.value === 'true' || item.value === 'false';
            const isChecked = item.value === 'true';

            return (
              <Card
                key={item.key}
                className="flex flex-col justify-between border border-border shadow-xs hover:shadow-sm transition-all"
              >
                <CardHeader className="pb-3 pt-4 px-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {meta?.label || item.key}
                      </span>
                      {meta?.badge && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                          {meta.badge}
                        </Badge>
                      )}
                    </div>
                    {isBoolean ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-semibold ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {isChecked ? '已启用' : '已关闭'}
                        </span>
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(item)}
                          disabled={saveMutation.isPending}
                        />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenTextEdit(item)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        修改
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {meta?.help || item.description || '无配置说明'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-0">
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                      <span className="font-sans text-muted-foreground/70">键:</span>
                      <span className="truncate">{item.key}</span>
                      <CopyButton text={item.key} />
                    </div>
                    {!isBoolean && (
                      <div className="flex items-center gap-1 max-w-[30%] truncate">
                        <span className="font-sans text-muted-foreground/70">当前值:</span>
                        <span className="truncate font-semibold text-foreground">{item.value || '(空)'}</span>
                      </div>
                    )}
                  </div>
                  {meta?.warning && isChecked && (
                    <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{meta.warning}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Value Dialog */}
      <Dialog open={!!textEditItem} onOpenChange={(open) => !open && setTextEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑【{textEditItem?.label}】</DialogTitle>
            <DialogDescription>
              键名: <code className="text-xs bg-muted px-1 py-0.5 rounded">{textEditItem?.key}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Label htmlFor="config-val" className="text-xs">配置参数值</Label>
            <Input
              id="config-val"
              value={textEditValue}
              onChange={(e) => setTextEditValue(e.target.value)}
              placeholder="请输入新配置值"
              className="text-xs h-9 font-mono"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTextEditItem(null)}>
              取消
            </Button>
            <Button size="sm" onClick={handleConfirmTextEdit}>
              下一步：填写原因
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Dialog for Auditing */}
      <ReasonDialog
        open={reasonDialogOpen}
        onOpenChange={setReasonDialogOpen}
        title={pendingUpdate?.title || '确认修改系统配置'}
        description={pendingUpdate?.warning ? `注意：${pendingUpdate.warning}` : '修改系统配置属于关键写操作，请录入原因以便审计追溯。'}
        placeholder="例如：提审发布版本 2.0 / 更新测试广告位 ID / 关闭大盘展示"
        loading={saveMutation.isPending}
        onConfirm={handleConfirmReason}
      />
    </div>
  );
}

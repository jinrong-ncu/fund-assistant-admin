'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DashboardSummary, HealthSummary } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Wallet,
  Star,
  MessageSquare,
  Flame,
  RotateCw,
  ExternalLink,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiClient.get<DashboardSummary>('/api/admin/dashboard/summary'),
  });

  const {
    data: health,
    isLoading: healthLoading,
    isFetching: healthFetching,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthSummary>('/api/admin/health'),
    refetchInterval: 60 * 1000,
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchHealth();
  };

  const isRefreshing = summaryFetching || healthFetching;

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="实时监控小程序用户体量、反馈受理及底层基础设施健康状态"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs h-9"
          >
            <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新状态
          </Button>
        }
      />

      {/* 6 Standard Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="全部用户"
          value={summary?.users ?? 0}
          icon={<Users className="h-4 w-4" />}
          iconColor="text-blue-500"
          loading={summaryLoading}
        />
        <MetricCard
          title="今日新增"
          value={summary?.newUsersToday ?? 0}
          icon={<UserPlus className="h-4 w-4" />}
          iconColor="text-cyan-500"
          loading={summaryLoading}
        />
        <MetricCard
          title="有金额记录"
          value={summary?.holdingsUsers ?? 0}
          icon={<Wallet className="h-4 w-4" />}
          iconColor="text-purple-500"
          loading={summaryLoading}
        />
        <MetricCard
          title="有关注清单"
          value={summary?.watchlistUsers ?? 0}
          icon={<Star className="h-4 w-4" />}
          iconColor="text-amber-500"
          loading={summaryLoading}
        />
        <MetricCard
          title="待处理反馈"
          value={summary?.feedback.open ?? 0}
          suffix={`/ ${summary?.feedback.total ?? 0}`}
          icon={<MessageSquare className="h-4 w-4" />}
          iconColor="text-pink-500"
          loading={summaryLoading}
        />
        <MetricCard
          title="启用热门内容"
          value={summary?.hotFundsActive ?? 0}
          icon={<Flame className="h-4 w-4" />}
          iconColor="text-emerald-500"
          loading={summaryLoading}
        />
      </div>

      {/* Lower Dashboard Section: Health and Feature Snapshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* System Health Summary */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">服务健康状态</CardTitle>
              </div>
              <CardDescription className="text-xs">
                每 60 秒定期自动巡检数据库、缓存及 API 可用性
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
              <Link href="/system/health">
                详情 <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthLoading ? (
              <div className="space-y-2 py-4">
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-md border border-border/60">
                {Object.entries(health?.checks || {}).map(([key, check]) => {
                  const name =
                    key === 'api'
                      ? 'Next.js API 接口服务'
                      : key === 'supabase'
                      ? 'PostgreSQL 数据库'
                      : key === 'redis'
                      ? 'Redis 缓存服务'
                      : key;

                  return (
                    <div key={key} className="flex items-center justify-between p-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          {check.ok ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <span>{name}</span>
                          {check.latencyMs !== undefined && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              ({check.latencyMs}ms)
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px]">{check.message}</p>
                      </div>
                      <StatusBadge
                        status={check.ok ? 'healthy' : 'unavailable'}
                        label={check.ok ? '正常' : '异常'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>最近检查时间: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Feature Switches Snapshot */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">关键功能状态快照</CardTitle>
              </div>
              <CardDescription className="text-xs">
                当前小程序端线上生效的功能特性与展示模式
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
              <Link href="/system/settings">
                前往设置 <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border/60 rounded-md border border-border/60">
              <div className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-medium text-foreground">提审合规模式</span>
                  <p className="text-[11px] text-muted-foreground">影响新增入口与 OCR 截图识别</p>
                </div>
                <Badge
                  variant={summary?.reviewMode ? 'destructive' : 'secondary'}
                  className="text-[11px] font-normal"
                >
                  {summary?.reviewMode ? '审核保护中' : '正常运作'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-medium text-foreground">行情大盘指数</span>
                  <p className="text-[11px] text-muted-foreground">金额记录页顶部指数模块</p>
                </div>
                <StatusBadge
                  status={summary?.showMarketIndices ? 'active' : 'inactive'}
                  label={summary?.showMarketIndices ? '已开启' : '已关闭'}
                />
              </div>

              <div className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-medium text-foreground">安全展示模式</span>
                  <p className="text-[11px] text-muted-foreground">中性工具文案与字段展示</p>
                </div>
                <StatusBadge
                  status={summary?.personalSafeMode ? 'active' : 'inactive'}
                  label={summary?.personalSafeMode ? '已开启' : '已关闭'}
                />
              </div>

              <div className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-medium text-foreground">截图 OCR 识别功能</span>
                  <p className="text-[11px] text-muted-foreground">用户导入资产截图识别功能</p>
                </div>
                <StatusBadge
                  status={summary?.ocrEnabled ? 'active' : 'inactive'}
                  label={summary?.ocrEnabled ? '已启用' : '已停用'}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              如需调整上述开关，请进入“系统设置”页面进行安全变更操作。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

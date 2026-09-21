'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { HealthSummary } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { CopyButton } from '@/components/admin/CopyButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDateTime } from '@/lib/formatters';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Server,
  Zap,
  RotateCw,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function HealthPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: health, isLoading, isFetching, refetch } = useQuery<HealthSummary>({
    queryKey: ['health-status'],
    queryFn: () => apiClient.get<HealthSummary>('/api/admin/health'),
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });

  const checks = health?.checks || {};
  const isHealthy = Object.values(checks).every((c) => c.ok);
  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter((c) => c.ok).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="服务健康监控"
        description="实时监控后台 API 服务、Supabase PostgreSQL 数据连接与 Upstash Redis 缓存运行健康状态"
        breadcrumbs={[
          { title: '控制台', href: '/' },
          { title: '服务健康' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-md">
              <span>30秒自动轮询</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
              <span>立即检测</span>
            </Button>
          </div>
        }
      />

      {/* Overview Banner Card */}
      <Card className="border border-border overflow-hidden">
        <div
          className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isHealthy
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent'
              : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                isHealthy
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {isHealthy ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {isHealthy ? '全核心微服务运转正常' : '部分服务存在降级或警告'}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isHealthy
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isHealthy ? 'Healthy' : 'Degraded'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                已通过 {passedChecks} / {totalChecks || 3} 项健康指标检查
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>检测时间:</span>
              <span className="font-semibold text-foreground">
                {health?.timestamp ? formatDateTime(health.timestamp) : '-'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Service Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. API Route */}
        <Card className="border border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Server className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold">API 网关服务</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                checks.api?.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }
            >
              {checks.api?.ok ? '运行中' : '不可用'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">处理控制台与小程序端的所有 RESTful 接口分发与鉴权。</p>
            <div className="pt-3 border-t border-border/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">通信协议:</span>
                <span className="font-mono font-medium">HTTP / HTTPS (Next.js Proxy)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">路由响应:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">200 OK</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Supabase Postgres */}
        <Card className="border border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Database className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold">Supabase 数据库</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                checks.supabase?.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }
            >
              {checks.supabase?.ok ? '连接正常' : '连接失败'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">托管的核心 PostgreSQL 数据库，存储用户、持仓、流水与配置。</p>
            <div className="pt-3 border-t border-border/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">环境配置:</span>
                <span className="font-mono">{checks.supabase?.configured ? '已配置 (Configured)' : '未配置'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Role 权限:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {checks.supabase?.serviceRole ? '已鉴权 (Active)' : '未授权'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Upstash Redis */}
        <Card className="border border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <Zap className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold">Upstash Redis 缓存</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                checks.redis?.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : checks.redis?.optional
                  ? 'border-muted text-muted-foreground'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }
            >
              {checks.redis?.ok ? '就绪' : checks.redis?.optional ? '可选 (未启用)' : '异常'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground">用于接口频控限流、热点行情数据缓存与高频 Session 缓存加速。</p>
            <div className="pt-3 border-t border-border/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">缓存状态:</span>
                <span className="font-mono">{checks.redis?.ok ? '连通运行中' : '非必填可选组件'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">降级机制:</span>
                <span className="font-mono text-muted-foreground">自动内存兜底</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Diagnostic Details Card */}
      <Card className="border border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">探测原始数据 (Diagnostic Payload)</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              实时探测服务响应的完整 JSON 结构报文
            </CardDescription>
          </div>
          {health && <CopyButton text={JSON.stringify(health, null, 2)} />}
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted/40 rounded-lg border border-border text-xs font-mono text-foreground leading-relaxed overflow-x-auto max-h-80">
            {health ? JSON.stringify(health, null, 2) : '正在等待探测数据...'}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

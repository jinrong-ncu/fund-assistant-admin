'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/admin-api';
import type { UserRow, UserDetails, TransactionRow } from '@/types';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CopyButton } from '@/components/admin/CopyButton';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { TransactionEditDialog } from './TransactionEditDialog';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RotateCw,
  MoreHorizontal,
  Edit2,
  Trash2,
  Calculator,
  Wallet,
  ArrowDownUp,
  Star,
  MessageSquare,
  Loader2,
  Calendar,
  Clock,
  UserCheck,
} from 'lucide-react';

interface UserDetailSheetProps {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('holdings');

  // Edit transaction state
  const [editingTx, setEditingTx] = useState<TransactionRow | null>(null);
  // Delete transaction state
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  // Recalculate holding state
  const [recalcFundCode, setRecalcFundCode] = useState<string | null>(null);

  // Fetch user details using adminApi.userDetails (which concurrently calls /holdings, /watchlist, /transactions, /feedback)
  const {
    data: details,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['user-details', user?.openid],
    queryFn: () => adminApi.userDetails(user!.openid),
    enabled: !!user && open,
  });

  const refreshAll = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // 1. Update transaction mutation
  const updateTxMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      adminApi.updateTransaction(editingTx!.id, values as any),
    onSuccess: () => {
      setEditingTx(null);
      refreshAll();
    },
  });

  // 2. Delete transaction mutation
  const deleteTxMutation = useMutation({
    mutationFn: (reason: string) => adminApi.deleteTransaction(deletingTxId!, reason),
    onSuccess: () => {
      setDeletingTxId(null);
      refreshAll();
    },
  });

  // 3. Recalculate holding mutation
  const recalcMutation = useMutation({
    mutationFn: (reason: string) =>
      adminApi.recalculateHolding(user!.openid, recalcFundCode!, reason),
    onSuccess: () => {
      setRecalcFundCode(null);
      refreshAll();
    },
  });

  if (!user) return null;

  // Calculate total holding market value
  const totalMarketValue =
    details?.holdings?.reduce((sum, h) => sum + (Number(h.current_value) || 0), 0) ?? 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col bg-background border-l border-border shadow-2xl h-full"
        >
          {/* Top User Identity Banner */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar className="h-14 w-14 border border-border shadow-xs">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                    {(user.nickname || '用').slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                      {user.nickname || '微信用户'}
                    </h2>
                    {user.user_code && (
                      <Badge variant="outline" className="font-mono text-[11px] font-normal bg-muted">
                        {user.user_code}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                      <UserCheck className="h-3 w-3 mr-1 text-emerald-500" />
                      已认证
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <span className="bg-muted px-2 py-0.5 rounded border border-border/80 text-foreground/80">
                      {user.openid}
                    </span>
                    <CopyButton text={user.openid} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-6 sm:pr-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-8 text-xs shrink-0"
                >
                  <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                  刷新画像
                </Button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="p-3 rounded-lg border border-border bg-muted/40">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5 text-primary/80" />
                  注册时间
                </div>
                <div className="text-xs font-semibold text-foreground tabular-nums truncate">
                  {formatDateTime(user.created_at)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/40">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5 text-primary/80" />
                  最后活跃
                </div>
                <div className="text-xs font-semibold text-foreground tabular-nums truncate">
                  {formatDateTime(user.last_active_at || user.last_login_at || user.updated_at)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/40">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                  持仓标的 / 总市值
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {details?.holdings?.length ?? user.holdingsCount} 只
                  </span>
                  {totalMarketValue > 0 && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      (¥{formatCurrency(totalMarketValue)})
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/40">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <ArrowDownUp className="h-3.5 w-3.5 text-blue-500" />
                  交易流水 / 自选
                </div>
                <div className="text-sm font-bold text-foreground tabular-nums">
                  {details?.transactions?.length ?? 0} 笔 / {details?.watchlist?.length ?? user.watchlistCount} 只
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b border-border bg-card">
              <TabsList className="h-11 w-full justify-start gap-3 bg-transparent p-0">
                <TabsTrigger
                  value="holdings"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-2 text-xs font-semibold gap-1.5 h-11"
                >
                  <Wallet className="h-4 w-4" />
                  持仓明细 ({details?.holdings?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-2 text-xs font-semibold gap-1.5 h-11"
                >
                  <ArrowDownUp className="h-4 w-4" />
                  流水记录 ({details?.transactions?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger
                  value="watchlist"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-2 text-xs font-semibold gap-1.5 h-11"
                >
                  <Star className="h-4 w-4" />
                  自选标的 ({details?.watchlist?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger
                  value="feedback"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary rounded-none px-2 text-xs font-semibold gap-1.5 h-11"
                >
                  <MessageSquare className="h-4 w-4" />
                  提交反馈 ({details?.feedback?.length ?? 0})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-16 text-muted-foreground text-xs">
                  <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
                  <span>正在查询用户持仓、流水与自选画像...</span>
                </div>
              ) : (
                <>
                  {/* Holdings Tab */}
                  <TabsContent value="holdings" className="m-0 space-y-3">
                    {details?.holdings?.length === 0 ? (
                      <div className="text-center py-16 text-xs text-muted-foreground rounded-lg border border-dashed border-border bg-card/40">
                        该用户暂无持仓资产数据
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 border-b border-border">
                            <tr>
                              <th className="p-3 text-left font-semibold">基金标的</th>
                              <th className="p-3 text-right font-semibold">最新市值</th>
                              <th className="p-3 text-right font-semibold">持仓成本</th>
                              <th className="p-3 text-right font-semibold">持有份额</th>
                              <th className="p-3 text-right font-semibold">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {details?.holdings?.map((h) => (
                              <tr key={h.fund_code} className="hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div className="font-semibold text-foreground text-xs">{h.fund_name}</div>
                                  <div className="font-mono text-muted-foreground text-[11px] mt-0.5">
                                    {h.fund_code}
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono tabular-nums font-bold text-foreground">
                                  ¥{formatCurrency(h.current_value)}
                                </td>
                                <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">
                                  ¥{formatCurrency(h.cost_amount)}
                                </td>
                                <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">
                                  {formatCurrency(h.shares)} 份
                                </td>
                                <td className="p-3 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-2.5 bg-background hover:bg-muted"
                                    onClick={() => setRecalcFundCode(h.fund_code)}
                                    title="根据流水记录重新计算当前基金持仓"
                                  >
                                    <Calculator className="h-3.5 w-3.5 mr-1 text-primary" />
                                    重算
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  {/* Transactions Tab */}
                  <TabsContent value="transactions" className="m-0 space-y-3">
                    {details?.transactions?.length === 0 ? (
                      <div className="text-center py-16 text-xs text-muted-foreground rounded-lg border border-dashed border-border bg-card/40">
                        该用户暂无买入或卖出交易流水
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-card overflow-x-auto shadow-xs">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 border-b border-border">
                            <tr>
                              <th className="p-3 text-left font-semibold">交易日期</th>
                              <th className="p-3 text-left font-semibold">标的代码</th>
                              <th className="p-3 text-left font-semibold">交易类型</th>
                              <th className="p-3 text-right font-semibold">发生金额</th>
                              <th className="p-3 text-right font-semibold">成交份额</th>
                              <th className="p-3 text-right font-semibold">确认净值</th>
                              <th className="p-3 text-left font-semibold">交易备注</th>
                              <th className="p-3 text-right font-semibold">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {details?.transactions?.map((tx) => (
                              <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                <td className="p-3 whitespace-nowrap text-muted-foreground tabular-nums">
                                  {tx.trade_date}
                                </td>
                                <td className="p-3 font-mono font-semibold text-foreground">{tx.fund_code}</td>
                                <td className="p-3">
                                  <StatusBadge
                                    status={tx.transaction_type === 'buy' ? 'active' : 'inactive'}
                                    label={tx.transaction_type === 'buy' ? '买入' : '卖出'}
                                  />
                                </td>
                                <td className="p-3 text-right font-mono tabular-nums font-bold text-foreground">
                                  ¥{formatCurrency(tx.amount)}
                                </td>
                                <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">
                                  {formatCurrency(tx.shares)}
                                </td>
                                <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">
                                  {tx.nav || '-'}
                                </td>
                                <td
                                  className="p-3 max-w-[120px] truncate text-muted-foreground"
                                  title={tx.remark || ''}
                                >
                                  {tx.remark || '-'}
                                </td>
                                <td className="p-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="text-xs">
                                      <DropdownMenuItem onClick={() => setEditingTx(tx)}>
                                        <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" />
                                        修改交易记录
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setDeletingTxId(tx.id)}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        删除流水
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  {/* Watchlist Tab */}
                  <TabsContent value="watchlist" className="m-0">
                    {details?.watchlist?.length === 0 ? (
                      <div className="text-center py-16 text-xs text-muted-foreground rounded-lg border border-dashed border-border bg-card/40">
                        自选清单为空
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 border-b border-border">
                            <tr>
                              <th className="p-3 text-left font-semibold">自选标的名称</th>
                              <th className="p-3 text-left font-semibold">基金代码</th>
                              <th className="p-3 text-left font-semibold">标的类型</th>
                              <th className="p-3 text-right font-semibold">添加关注时间</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {details?.watchlist?.map((w) => (
                              <tr key={w.fund_code} className="hover:bg-muted/50 transition-colors">
                                <td className="p-3 font-semibold text-foreground">{w.fund_name}</td>
                                <td className="p-3 font-mono text-muted-foreground">{w.fund_code}</td>
                                <td className="p-3">
                                  <Badge variant="outline" className="text-[10px] font-normal">
                                    {w.fund_type || '开放式基金'}
                                  </Badge>
                                </td>
                                <td className="p-3 text-right text-muted-foreground tabular-nums">
                                  {formatDateTime(w.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  {/* Feedback Tab */}
                  <TabsContent value="feedback" className="m-0">
                    {details?.feedback?.length === 0 ? (
                      <div className="text-center py-16 text-xs text-muted-foreground rounded-lg border border-dashed border-border bg-card/40">
                        该用户未提交过任何使用反馈
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {details?.feedback?.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground bg-muted px-2.5 py-1 rounded text-xs">
                                {f.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <StatusBadge
                                  status={
                                    f.status === 'resolved'
                                      ? 'active'
                                      : f.status === 'ignored'
                                      ? 'inactive'
                                      : 'pending'
                                  }
                                  label={
                                    f.status === 'resolved'
                                      ? '已解决'
                                      : f.status === 'processing'
                                      ? '处理中'
                                      : f.status === 'ignored'
                                      ? '已忽略'
                                      : '待处理'
                                  }
                                />
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                  {formatDateTime(f.created_at)}
                                </span>
                              </div>
                            </div>
                            <p className="text-foreground leading-relaxed pt-1">{f.content}</p>
                            {f.admin_note && (
                              <div className="mt-2 p-2.5 bg-muted/60 rounded-md text-[11px] text-muted-foreground border border-border">
                                <strong className="text-foreground font-semibold">
                                  处理备注 / 答复:
                                </strong>{' '}
                                {f.admin_note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Edit Transaction Modal */}
      <TransactionEditDialog
        open={!!editingTx}
        onOpenChange={(open) => !open && setEditingTx(null)}
        transaction={editingTx}
        loading={updateTxMutation.isPending}
        onSubmit={async (values) => {
          await updateTxMutation.mutateAsync(values);
        }}
      />

      {/* Delete Transaction Reason Dialog */}
      <ReasonDialog
        open={!!deletingTxId}
        onOpenChange={(open) => !open && setDeletingTxId(null)}
        title="确认删除该交易流水？"
        description="删除后，系统将从全部剩余流水中重新计算该基金的持仓金额与份额。操作不可逆。"
        destructive
        confirmLabel="确认删除流水"
        loading={deleteTxMutation.isPending}
        onConfirm={async (reason) => {
          await deleteTxMutation.mutateAsync(reason);
        }}
      />

      {/* Recalculate Holding Reason Dialog */}
      <ReasonDialog
        open={!!recalcFundCode}
        onOpenChange={(open) => !open && setRecalcFundCode(null)}
        title={`重新计算基金 [${recalcFundCode}] 持仓？`}
        description="系统将依据该用户该标的从最初至今的每一笔流水重新复权汇总持仓金额。请录入重算原因用于审计追踪。"
        confirmLabel="开始重新计算"
        loading={recalcMutation.isPending}
        onConfirm={async (reason) => {
          await recalcMutation.mutateAsync(reason);
        }}
      />
    </>
  );
}

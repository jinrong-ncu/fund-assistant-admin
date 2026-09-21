'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AdminMarketConfig, MarketStock, MarketStockSearchResult } from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RotateCw,
  Search,
  Plus,
  Trash2,
  Database,
  Building2,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function StockPoolPage() {
  const queryClient = useQueryClient();

  // Local state
  const [filterKeyword, setFilterKeyword] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<MarketStockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reason dialog state
  const [actionType, setActionType] = useState<'resolve' | 'refresh' | 'delete' | null>(null);
  const [targetSecid, setTargetSecid] = useState<string | null>(null);
  const [targetStockName, setTargetStockName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Market Config (Stocks + Layout)
  const { data: config, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['market-config'],
    queryFn: () => apiClient.get<AdminMarketConfig>('/api/admin/market-config'),
  });

  const stocks = useMemo(() => config?.stocks || [], [config?.stocks]);

  // Set of stocks currently referenced in the layout (tickers or modules)
  const referencedSecids = useMemo(() => {
    const set = new Set<string>();
    if (!config?.layout) return set;
    config.layout.tickers?.forEach((t) => set.add(t.secid));
    config.layout.tabs?.forEach((tab) => {
      tab.sections?.forEach((sec) => {
        sec.modules?.forEach((mod) => {
          mod.stockSecids?.forEach((s) => set.add(s));
        });
      });
    });
    return set;
  }, [config?.layout]);

  // Filtered stocks list
  const filteredStocks = useMemo(() => {
    if (!filterKeyword.trim()) return stocks;
    const kw = filterKeyword.toLowerCase().trim();
    return stocks.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        s.code.toLowerCase().includes(kw) ||
        s.secid.toLowerCase().includes(kw)
    );
  }, [stocks, filterKeyword]);

  // EastMoney stock search mutation
  const searchMutation = useMutation({
    mutationFn: (keyword: string) =>
      apiClient.get<MarketStockSearchResult[]>(
        `/api/admin/market-stocks/search?keyword=${encodeURIComponent(keyword)}`
      ),
    onSuccess: (data) => {
      setSearchResults(data || []);
      setIsSearching(false);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || '搜索失败');
      setIsSearching(false);
    },
  });

  // Resolve / Add stock to pool
  const resolveMutation = useMutation({
    mutationFn: ({ secid, reason }: { secid: string; reason: string }) =>
      apiClient.post('/api/admin/market-stocks/resolve', { secid, reason }),
    onSuccess: () => {
      setActionType(null);
      setTargetSecid(null);
      setIsSearchModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || '添加失败');
    },
  });

  // Refresh stock quotes from EastMoney
  const refreshMutation = useMutation({
    mutationFn: ({ secid, reason }: { secid: string; reason: string }) =>
      apiClient.put(`/api/admin/market-stocks/${encodeURIComponent(secid)}/refresh`, { reason }),
    onSuccess: () => {
      setActionType(null);
      setTargetSecid(null);
      queryClient.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || '刷新失败');
    },
  });

  // Delete unreferenced stock
  const deleteMutation = useMutation({
    mutationFn: ({ secid, reason }: { secid: string; reason: string }) =>
      apiClient.delete(
        `/api/admin/market-stocks/${encodeURIComponent(secid)}?reason=${encodeURIComponent(reason)}`
      ),
    onSuccess: () => {
      setActionType(null);
      setTargetSecid(null);
      queryClient.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || '删除失败，可能仍被页面编排引用');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    setErrorMessage(null);
    searchMutation.mutate(searchKeyword.trim());
  };

  const handleConfirmAction = async (reason: string) => {
    if (!targetSecid || !actionType) return;
    setErrorMessage(null);
    if (actionType === 'resolve') {
      await resolveMutation.mutateAsync({ secid: targetSecid, reason });
    } else if (actionType === 'refresh') {
      await refreshMutation.mutateAsync({ secid: targetSecid, reason });
    } else if (actionType === 'delete') {
      await deleteMutation.mutateAsync({ secid: targetSecid, reason });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="股票标的库"
        description="管理行情引擎支持的东财股票/指数标的库。所有名称统一由东财源获取写入，作为行情编排的数据基石。"
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
              刷新库
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSearchKeyword('');
                setSearchResults([]);
                setErrorMessage(null);
                setIsSearchModalOpen(true);
              }}
              className="text-xs h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              从东财搜索并加入
            </Button>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">股票库总数</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">{stocks.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            涵盖沪深A股、港股、美股指数与主流ETF
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">已在编排中使用</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-primary">
              {referencedSecids.size}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            被顶部走马灯或各分类模块引用的标的
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">空闲标的</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-muted-foreground">
              {stocks.length - referencedSecids.size}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            未被当前布局引用的标的，可安全删除
          </CardContent>
        </Card>
      </div>

      {/* Stock List Card */}
      <Card>
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              标的清单
            </CardTitle>
            <CardDescription className="text-xs">
              支持按代码、名称或东财 secid 实时筛选
            </CardDescription>
          </div>
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索名称 / 代码 / secid..."
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold">标的名称</th>
                  <th className="p-3 text-left font-semibold">证券代码</th>
                  <th className="p-3 text-left font-semibold">东财 secid</th>
                  <th className="p-3 text-left font-semibold">市场 / 交易所</th>
                  <th className="p-3 text-left font-semibold">引用状态</th>
                  <th className="p-3 text-left font-semibold">最后同步时间</th>
                  <th className="p-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={7} className="p-4">
                        <div className="h-5 animate-pulse bg-muted rounded" />
                      </td>
                    </tr>
                  ))
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      {filterKeyword ? '未找到符合条件的标的' : '标的库为空，请点击右上角添加'}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const isReferenced = referencedSecids.has(stock.secid);
                    return (
                      <tr key={stock.secid} className="hover:bg-muted/30">
                        <td className="p-3 font-semibold text-foreground">
                          {stock.name}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {stock.code}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                            {stock.secid}
                          </code>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {stock.securityType || (stock.market === 0 ? '深市' : '沪市')}
                            </Badge>
                            {stock.exchange && (
                              <span className="text-[11px] text-muted-foreground">
                                {stock.exchange}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {isReferenced ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-normal">
                              已在编排引用
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                              未引用
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground tabular-nums">
                          {stock.sourceUpdatedAt ? formatDate(stock.sourceUpdatedAt) : '初始化'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="从东财同步更新该标的最新名称与属性"
                              onClick={() => {
                                setActionType('refresh');
                                setTargetSecid(stock.secid);
                                setTargetStockName(stock.name);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              同步
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={
                                isReferenced
                                  ? '该标的仍被页面布局引用，无法删除'
                                  : '从股票标的库中移除'
                              }
                              disabled={isReferenced}
                              onClick={() => {
                                setActionType('delete');
                                setTargetSecid(stock.secid);
                                setTargetStockName(stock.name);
                              }}
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EastMoney Stock Search Modal */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              从东方财富搜索标的
            </DialogTitle>
            <DialogDescription className="text-xs">
              输入股票代码、拼音缩写或中文名称（如 NVDA, 贵州茅台, 000001），直接从东财实时检索并录入股票库。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="例如：600519、纳斯达克、腾讯控股、SPY..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9 text-xs h-9"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" disabled={isSearching || !searchKeyword.trim()}>
                {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                搜索东财
              </Button>
            </form>

            {errorMessage && (
              <div className="p-2.5 bg-destructive/10 text-destructive rounded border border-destructive/20 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="rounded-md border border-border/80 max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0 border-b">
                  <tr>
                    <th className="p-2.5 text-left font-semibold">名称</th>
                    <th className="p-2.5 text-left font-semibold">代码</th>
                    <th className="p-2.5 text-left font-semibold">secid</th>
                    <th className="p-2.5 text-left font-semibold">市场 / 交易所</th>
                    <th className="p-2.5 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                        {isSearching
                          ? '正在从东财检索标的...'
                          : '请输入关键词开始搜索'}
                      </td>
                    </tr>
                  ) : (
                    searchResults.map((item) => {
                      const exists = stocks.some((s) => s.secid === item.secid);
                      return (
                        <tr key={item.secid} className="hover:bg-muted/30">
                          <td className="p-2.5 font-semibold text-foreground">
                            {item.name}
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">
                            {item.code}
                          </td>
                          <td className="p-2.5 font-mono text-xs">
                            <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                              {item.secid}
                            </code>
                          </td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {item.securityType} {item.exchange ? `· ${item.exchange}` : ''}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right">
                            {exists ? (
                              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                已在库中
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setActionType('resolve');
                                  setTargetSecid(item.secid);
                                  setTargetStockName(item.name);
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                加入库
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                标的名称和代码由东财统一管理与格式化，无需手动编写。加入库后即可在「布局编排器」中任意配置引用。
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reason Dialog for write operations */}
      <ReasonDialog
        open={Boolean(actionType && targetSecid)}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setTargetSecid(null);
          }
        }}
        title={
          actionType === 'resolve'
            ? `确认将「${targetStockName}」加入标的库？`
            : actionType === 'refresh'
            ? `确认从东财刷新「${targetStockName}」？`
            : `确认删除标的「${targetStockName}」？`
        }
        description={
          actionType === 'delete'
            ? '删除后该标的将从后台股票库中彻底移除。已被页面编排引用的标的无法删除。'
            : '此操作会同步向数据库写入并记录审计日志。'
        }
        confirmLabel={
          actionType === 'delete' ? '确认删除' : actionType === 'refresh' ? '确认刷新' : '确认加入'
        }
        destructive={actionType === 'delete'}
        loading={resolveMutation.isPending || refreshMutation.isPending || deleteMutation.isPending}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

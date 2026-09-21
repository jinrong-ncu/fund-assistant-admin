'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AdminMarketConfig,
  MarketLayout,
  MarketStock,
  MarketTabLayout,
  MarketSectionLayout,
  MarketModuleLayout,
  MarketTickerLayout,
} from '@/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RotateCw,
  Save,
  Plus,
  Trash2,
  Layers,
  ArrowUpRight,
  GripVertical,
  Activity,
  FolderTree,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function cloneLayout(layout: MarketLayout): MarketLayout {
  return structuredClone(layout);
}

export default function LayoutBuilderPage() {
  const queryClient = useQueryClient();

  // Layout State
  const [layout, setLayout] = useState<MarketLayout | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // 1. Fetch Market Config (Stocks + Layout)
  const { data: config, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['market-config'],
    queryFn: () => apiClient.get<AdminMarketConfig>('/api/admin/market-config'),
  });

  // Initial populate layout
  useEffect(() => {
    if (config?.layout && !dirty) {
      setLayout(cloneLayout(config.layout));
      if (config.layout.tabs?.length && !activeTabKey) {
        setActiveTabKey(config.layout.defaultTabKey || config.layout.tabs[0].key);
      }
    }
  }, [config?.layout, dirty, activeTabKey]);

  const stocks = useMemo(() => config?.stocks || [], [config?.stocks]);
  const stockMap = useMemo(
    () => new Map(stocks.map((s) => [s.secid, s])),
    [stocks]
  );

  // Mutator helper
  const updateLayout = (mutator: (next: MarketLayout) => void) => {
    setLayout((current) => {
      if (!current) return current;
      const next = cloneLayout(current);
      mutator(next);
      return next;
    });
    setDirty(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!layout) throw new Error('配置未初始化');
      return apiClient.put<{ version: number; layout: MarketLayout }>(
        '/api/admin/market-config/layout',
        { layout, reason }
      );
    },
    onSuccess: (res) => {
      setDirty(false);
      setLayout(cloneLayout(res.layout));
      setSaveSuccessMsg(`保存成功！当前布局版本：v${res.version}`);
      setIsReasonDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['market-config'] });
    },
    onError: (err: Error) => {
      setSaveErrorMsg(err.message || '保存失败');
      setIsReasonDialogOpen(false);
    },
  });

  // Actions for Tickers
  const addTicker = () => {
    if (!stocks.length) return alert('标的库为空，请先在「股票标的库」添加');
    const used = new Set(layout?.tickers?.map((t) => t.secid));
    const candidate = stocks.find((s) => !used.has(s.secid)) || stocks[0];
    updateLayout((next) => {
      if (!next.tickers) next.tickers = [];
      next.tickers.push({
        secid: candidate.secid,
        label: candidate.name,
        enabled: true,
        sortOrder: next.tickers.length * 10,
      });
    });
  };

  const removeTicker = (index: number) => {
    updateLayout((next) => {
      next.tickers.splice(index, 1);
    });
  };

  // Actions for Tabs
  const addTab = () => {
    const key = nextId('tab');
    updateLayout((next) => {
      if (!next.tabs) next.tabs = [];
      next.tabs.push({
        key,
        label: '新标签',
        enabled: true,
        sortOrder: next.tabs.length * 10,
        sections: [],
      });
      if (!next.defaultTabKey) next.defaultTabKey = key;
    });
    setActiveTabKey(key);
  };

  const removeTab = (tabIndex: number) => {
    updateLayout((next) => {
      const removedKey = next.tabs[tabIndex].key;
      next.tabs.splice(tabIndex, 1);
      if (next.defaultTabKey === removedKey) {
        next.defaultTabKey = next.tabs[0]?.key || '';
      }
      if (activeTabKey === removedKey) {
        setActiveTabKey(next.tabs[0]?.key || '');
      }
    });
  };

  // Actions for Sections
  const addSection = (tabIndex: number) => {
    updateLayout((next) => {
      const sections = next.tabs[tabIndex].sections;
      sections.push({
        id: nextId('section'),
        title: '新分组',
        enabled: true,
        sortOrder: sections.length * 10,
        modules: [],
      });
    });
  };

  const removeSection = (tabIndex: number, sectionIndex: number) => {
    updateLayout((next) => {
      next.tabs[tabIndex].sections.splice(sectionIndex, 1);
    });
  };

  // Actions for Modules
  const addModule = (tabIndex: number, sectionIndex: number) => {
    if (!stocks.length) return alert('标的库为空，请先在「股票标的库」添加');
    updateLayout((next) => {
      const modules = next.tabs[tabIndex].sections[sectionIndex].modules;
      modules.push({
        id: nextId('module'),
        title: '新模块',
        icon: '📈',
        type: 'DIRECT',
        enabled: true,
        sortOrder: modules.length * 10,
        stockSecids: [stocks[0].secid],
      });
    });
  };

  const removeModule = (tabIndex: number, sectionIndex: number, moduleIndex: number) => {
    updateLayout((next) => {
      next.tabs[tabIndex].sections[sectionIndex].modules.splice(moduleIndex, 1);
    });
  };

  const currentTab = useMemo(() => {
    if (!layout?.tabs) return null;
    return layout.tabs.find((t) => t.key === activeTabKey) || layout.tabs[0];
  }, [layout?.tabs, activeTabKey]);

  const currentTabIndex = useMemo(() => {
    if (!layout?.tabs || !currentTab) return -1;
    return layout.tabs.findIndex((t) => t.key === currentTab.key);
  }, [layout?.tabs, currentTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="行情布局编排器"
        description="可视化编排小程序行情页面的分类 Tab、分组 Section 及组件 Module，保存后全局原子生效。"
        actions={
          <div className="flex items-center gap-2">
            {dirty && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                有未保存修改
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs h-9"
            >
              <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              重新拉取
            </Button>
            <Button
              size="sm"
              disabled={!dirty || !layout}
              onClick={() => setIsReasonDialogOpen(true)}
              className="text-xs h-9"
            >
              <Save className="h-4 w-4 mr-1.5" />
              保存编排并生效
            </Button>
          </div>
        }
      />

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {saveErrorMsg}
        </div>
      )}

      {isLoading || !layout ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          正在加载行情布局配置...
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: Top Tickers Bar */}
          <Card>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  顶部行情跑马灯指标 (Tickers)
                </CardTitle>
                <CardDescription className="text-xs">
                  展示于小程序行情页顶部的横向滚动大盘指标（如上证指数、标普500等）
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addTicker} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加指标
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {layout.tickers?.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  暂无顶部指标，点击右上角添加
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {layout.tickers?.map((ticker, idx) => {
                    const currentStock = stockMap.get(ticker.secid);
                    return (
                      <div
                        key={`${ticker.secid}-${idx}`}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-border/70 bg-card/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <Select
                              value={ticker.secid}
                              onValueChange={(val) => {
                                updateLayout((next) => {
                                  next.tickers[idx].secid = val;
                                  next.tickers[idx].label =
                                    stockMap.get(val)?.name || next.tickers[idx].label;
                                });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs font-medium">
                                <SelectValue placeholder="选择标的" />
                              </SelectTrigger>
                              <SelectContent>
                                {stocks.map((s) => (
                                  <SelectItem key={s.secid} value={s.secid} className="text-xs">
                                    {s.name} ({s.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTicker(idx)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">展示名称</Label>
                            <Input
                              value={ticker.label}
                              onChange={(e) => {
                                updateLayout((next) => {
                                  next.tickers[idx].label = e.target.value;
                                });
                              }}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">排序权重</Label>
                            <Input
                              type="number"
                              value={ticker.sortOrder}
                              onChange={(e) => {
                                updateLayout((next) => {
                                  next.tickers[idx].sortOrder = Number(e.target.value) || 0;
                                });
                              }}
                              className="h-7 text-xs tabular-nums"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px] border-t border-border/40">
                          <span className="text-muted-foreground">
                            代码: {currentStock?.code || ticker.secid}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">
                              {ticker.enabled ? '已启用' : '已停用'}
                            </span>
                            <Switch
                              checked={ticker.enabled}
                              onCheckedChange={(checked) => {
                                updateLayout((next) => {
                                  next.tickers[idx].enabled = checked;
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 2: Tabs and Modular Hierarchies */}
          <Card>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  行情分类 Tab 与模块编排
                </CardTitle>
                <CardDescription className="text-xs">
                  层级结构：分类 Tab ➔ 分组 Section ➔ 指数模块 Module（单标的直读或成分股等权平均）
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">默认展示 Tab:</span>
                  <Select
                    value={layout.defaultTabKey}
                    onValueChange={(val) => {
                      updateLayout((next) => {
                        next.defaultTabKey = val;
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue placeholder="选择默认 Tab" />
                    </SelectTrigger>
                    <SelectContent>
                      {layout.tabs
                        ?.filter((t) => t.enabled)
                        .map((t) => (
                          <SelectItem key={t.key} value={t.key} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={addTab} className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  新增 Tab
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {layout.tabs?.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  暂无任何 Tab，请点击右上角新增
                </div>
              ) : (
                <Tabs
                  value={activeTabKey || layout.tabs[0]?.key}
                  onValueChange={setActiveTabKey}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-border/80 pb-2">
                    <TabsList className="bg-muted/60 p-1">
                      {layout.tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.key}
                          value={tab.key}
                          className="text-xs font-medium px-3 py-1.5"
                        >
                          {tab.label}
                          {!tab.enabled && (
                            <span className="ml-1 text-[10px] text-muted-foreground opacity-70">
                              (停用)
                            </span>
                          )}
                          {layout.defaultTabKey === tab.key && (
                            <span className="ml-1 text-[10px] text-primary">★</span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Active Tab Details and Sections */}
                  {currentTab && currentTabIndex >= 0 && (
                    <div className="space-y-6">
                      {/* Tab Property Editor */}
                      <div className="p-3 bg-muted/20 rounded-lg border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                          <div className="space-y-1 flex-1">
                            <Label className="text-[11px] text-muted-foreground">Tab 名称</Label>
                            <Input
                              value={currentTab.label}
                              onChange={(e) => {
                                updateLayout((next) => {
                                  next.tabs[currentTabIndex].label = e.target.value;
                                });
                              }}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1 w-24">
                            <Label className="text-[11px] text-muted-foreground">排序权重</Label>
                            <Input
                              type="number"
                              value={currentTab.sortOrder}
                              onChange={(e) => {
                                updateLayout((next) => {
                                  next.tabs[currentTabIndex].sortOrder =
                                    Number(e.target.value) || 0;
                                });
                              }}
                              className="h-8 text-xs tabular-nums"
                            />
                          </div>
                          <div className="space-y-1 flex flex-col justify-end pt-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground">启用此 Tab</span>
                              <Switch
                                checked={currentTab.enabled}
                                onCheckedChange={(checked) => {
                                  updateLayout((next) => {
                                    next.tabs[currentTabIndex].enabled = checked;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addSection(currentTabIndex)}
                            className="h-8 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            在此 Tab 下新增分组
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTab(currentTabIndex)}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            删除 Tab
                          </Button>
                        </div>
                      </div>

                      {/* Sections List */}
                      <div className="space-y-4">
                        {currentTab.sections?.length === 0 ? (
                          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                            当前 Tab 下暂无分组，请点击右上角「在此 Tab 下新增分组」
                          </div>
                        ) : (
                          currentTab.sections.map((section, sIdx) => (
                            <div
                              key={section.id}
                              className="border border-border rounded-lg bg-card/40 overflow-hidden"
                            >
                              {/* Section Header */}
                              <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3 flex-1">
                                  <FolderTree className="h-4 w-4 text-primary shrink-0" />
                                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                                    <Input
                                      value={section.title}
                                      onChange={(e) => {
                                        updateLayout((next) => {
                                          next.tabs[currentTabIndex].sections[sIdx].title =
                                            e.target.value;
                                        });
                                      }}
                                      className="h-7 text-xs font-semibold bg-background"
                                      placeholder="分组标题"
                                    />
                                    <Input
                                      type="number"
                                      value={section.sortOrder}
                                      onChange={(e) => {
                                        updateLayout((next) => {
                                          next.tabs[currentTabIndex].sections[sIdx].sortOrder =
                                            Number(e.target.value) || 0;
                                        });
                                      }}
                                      className="h-7 text-xs w-20 tabular-nums bg-background"
                                      placeholder="排序"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={section.enabled}
                                      onCheckedChange={(checked) => {
                                        updateLayout((next) => {
                                          next.tabs[currentTabIndex].sections[sIdx].enabled =
                                            checked;
                                        });
                                      }}
                                    />
                                    <span className="text-[11px] text-muted-foreground">
                                      {section.enabled ? '已启用' : '已停用'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addModule(currentTabIndex, sIdx)}
                                    className="h-7 text-xs bg-background"
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    添加模块
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeSection(currentTabIndex, sIdx)}
                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Modules in Section */}
                              <div className="p-3 space-y-3">
                                {section.modules?.length === 0 ? (
                                  <div className="text-center py-4 text-xs text-muted-foreground">
                                    分组下暂无模块，请点击右上角「添加模块」
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {section.modules.map((mod, mIdx) => (
                                      <div
                                        key={mod.id}
                                        className="p-3 border border-border/80 rounded-md bg-background flex flex-col gap-2.5 text-xs shadow-sm"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 flex-1">
                                            <Input
                                              value={mod.icon}
                                              onChange={(e) => {
                                                updateLayout((next) => {
                                                  next.tabs[currentTabIndex].sections[
                                                    sIdx
                                                  ].modules[mIdx].icon = e.target.value;
                                                });
                                              }}
                                              className="h-7 w-10 text-center px-1 text-sm bg-muted/30"
                                              title="模块图标（支持 Emoji）"
                                            />
                                            <Input
                                              value={mod.title}
                                              onChange={(e) => {
                                                updateLayout((next) => {
                                                  next.tabs[currentTabIndex].sections[
                                                    sIdx
                                                  ].modules[mIdx].title = e.target.value;
                                                });
                                              }}
                                              className="h-7 flex-1 text-xs font-medium"
                                              placeholder="模块名称"
                                            />
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeModule(currentTabIndex, sIdx, mIdx)
                                            }
                                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                          <div className="col-span-2">
                                            <Label className="text-[11px] text-muted-foreground">
                                              计算模型
                                            </Label>
                                            <Select
                                              value={mod.type}
                                              onValueChange={(val: 'DIRECT' | 'AVERAGE') => {
                                                updateLayout((next) => {
                                                  next.tabs[currentTabIndex].sections[
                                                    sIdx
                                                  ].modules[mIdx].type = val;
                                                });
                                              }}
                                            >
                                              <SelectTrigger className="h-7 text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="DIRECT" className="text-xs">
                                                  单标的直读 (DIRECT)
                                                </SelectItem>
                                                <SelectItem value="AVERAGE" className="text-xs">
                                                  成分股等权平均 (AVERAGE)
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div>
                                            <Label className="text-[11px] text-muted-foreground">
                                              排序
                                            </Label>
                                            <Input
                                              type="number"
                                              value={mod.sortOrder}
                                              onChange={(e) => {
                                                updateLayout((next) => {
                                                  next.tabs[currentTabIndex].sections[
                                                    sIdx
                                                  ].modules[mIdx].sortOrder =
                                                    Number(e.target.value) || 0;
                                                });
                                              }}
                                              className="h-7 text-xs tabular-nums"
                                            />
                                          </div>
                                        </div>

                                        {/* Stock Secids Selector */}
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-[11px] text-muted-foreground">
                                              关联标的 ({mod.stockSecids?.length || 0})
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground">
                                              {mod.type === 'DIRECT'
                                                ? '直读模式建议选 1 只'
                                                : '平均模式需选多只'}
                                            </span>
                                          </div>

                                          <div className="flex flex-wrap gap-1 p-1.5 bg-muted/20 border border-border/60 rounded-md min-h-12 items-center">
                                            {mod.stockSecids?.map((secid) => {
                                              const stock = stockMap.get(secid);
                                              return (
                                                <Badge
                                                  key={secid}
                                                  variant="secondary"
                                                  className="text-[11px] font-normal flex items-center gap-1 pl-2 pr-1 py-0.5"
                                                >
                                                  <span>{stock?.name || secid}</span>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateLayout((next) => {
                                                        next.tabs[currentTabIndex].sections[
                                                          sIdx
                                                        ].modules[mIdx].stockSecids =
                                                          mod.stockSecids.filter((s) => s !== secid);
                                                      });
                                                    }}
                                                    className="hover:text-destructive p-0.5 rounded"
                                                  >
                                                    ×
                                                  </button>
                                                </Badge>
                                              );
                                            })}

                                            {/* Quick Add Stock Selector */}
                                            <div className="w-32">
                                              <Select
                                                value=""
                                                onValueChange={(val) => {
                                                  if (!val || mod.stockSecids.includes(val)) return;
                                                  updateLayout((next) => {
                                                    next.tabs[currentTabIndex].sections[
                                                      sIdx
                                                    ].modules[mIdx].stockSecids.push(val);
                                                  });
                                                }}
                                              >
                                                <SelectTrigger className="h-6 text-[11px] border-dashed">
                                                  <SelectValue placeholder="+ 增加标的" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {stocks
                                                    .filter((s) => !mod.stockSecids.includes(s.secid))
                                                    .map((s) => (
                                                      <SelectItem
                                                        key={s.secid}
                                                        value={s.secid}
                                                        className="text-xs"
                                                      >
                                                        {s.name} ({s.code})
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                                          <span className="text-muted-foreground">
                                            模块状态: {mod.enabled ? '启用' : '停用'}
                                          </span>
                                          <Switch
                                            checked={mod.enabled}
                                            onCheckedChange={(checked) => {
                                              updateLayout((next) => {
                                                next.tabs[currentTabIndex].sections[
                                                  sIdx
                                                ].modules[mIdx].enabled = checked;
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Reason Dialog on Save */}
      <ReasonDialog
        open={isReasonDialogOpen}
        onOpenChange={setIsReasonDialogOpen}
        title="确认保存行情编排并生效？"
        description="该操作会进行全量结构合法性校验并在数据库事务中生成新版配置，小程序端实时更新。"
        confirmLabel="确认保存生效"
        loading={saveMutation.isPending}
        onConfirm={async (reason) => {
          await saveMutation.mutateAsync(reason);
        }}
      />
    </div>
  );
}

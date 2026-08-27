import { jsonRequest, request } from './request';
import type { AdminMarketConfig, AuditLog, Changelog, DashboardSummary, FeedbackRow, HealthSummary, HotFund, MarketLayout, MarketStock, MarketStockSearchResult, Paginated, ResourceEntry, SystemConfig, TransactionRow, UserDetails, UserRow } from '@/types';

export const adminApi = {
  dashboard: () => request<DashboardSummary>('/api/admin/dashboard/summary'),
  health: () => request<HealthSummary>('/api/admin/health'),
  users: (params: { keyword?: string; page: number; pageSize: number }) => {
    const search = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.keyword) search.set('keyword', params.keyword);
    return request<Paginated<UserRow>>(`/api/admin/users?${search}`);
  },
  userDetails: async (openid: string): Promise<UserDetails> => {
    const encoded = encodeURIComponent(openid);
    const [holdings, watchlist, transactions, feedback] = await Promise.all([
      request<UserDetails['holdings']>(`/api/admin/users/${encoded}/holdings`),
      request<UserDetails['watchlist']>(`/api/admin/users/${encoded}/watchlist`),
      request<UserDetails['transactions']>(`/api/admin/users/${encoded}/transactions`),
      request<UserDetails['feedback']>(`/api/admin/users/${encoded}/feedback`),
    ]);
    return { holdings, watchlist, transactions, feedback };
  },
  updateTransaction: (id: string, payload: Partial<TransactionRow> & { reason: string }) => request(`/api/admin/transactions/${id}`, jsonRequest('PUT', payload)),
  deleteTransaction: (id: string, reason: string) => request(`/api/admin/transactions/${id}`, jsonRequest('DELETE', { reason })),
  recalculateHolding: (openid: string, fundCode: string, reason: string) => request('/api/admin/holdings/recalculate', jsonRequest('POST', { openid, fundCode, reason })),
  feedback: (params: { status?: string; page: number; pageSize: number }) => {
    const search = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.status) search.set('status', params.status);
    return request<Paginated<FeedbackRow>>(`/api/admin/feedback?${search}`);
  },
  updateFeedback: (id: string, payload: Partial<FeedbackRow>) => request(`/api/admin/feedback/${id}`, jsonRequest('PUT', payload)),
  hotFunds: () => request<HotFund[]>('/api/admin/hot-funds'),
  saveHotFund: (payload: Record<string, unknown>, id?: number) => request(`/api/admin/hot-funds${id ? `/${id}` : ''}`, jsonRequest(id ? 'PUT' : 'POST', payload)),
  deleteHotFund: (id: number) => request(`/api/admin/hot-funds/${id}`, jsonRequest('DELETE', { reason: '后台删除热门内容' })),
  changelogs: () => request<Changelog[]>('/api/admin/changelogs'),
  saveChangelog: (payload: Record<string, unknown>, id?: number) => request('/api/admin/changelogs', jsonRequest(id ? 'PUT' : 'POST', { ...payload, id })),
  deleteChangelog: (id: number) => request(`/api/admin/changelogs?id=${id}`, jsonRequest('DELETE', { reason: '后台删除版本日志' })),
  resources: () => request<ResourceEntry[]>('/api/admin/resources'),
  saveResource: (payload: Record<string, unknown>, id?: string) => request(`/api/admin/resources${id ? `/${id}` : ''}`, jsonRequest(id ? 'PUT' : 'POST', payload)),
  deleteResource: (id: string) => request(`/api/admin/resources/${id}`, jsonRequest('DELETE', { reason: '后台删除资源' })),
  configs: () => request<SystemConfig[]>('/api/admin/configs'),
  saveConfig: (item: SystemConfig, value: string) => request(`/api/admin/configs/${encodeURIComponent(item.key)}`, jsonRequest('PUT', { value, description: item.description, reason: `后台修改 ${item.key}` })),
  marketConfig: () => request<AdminMarketConfig>('/api/admin/market-config'),
  saveMarketLayout: (layout: MarketLayout) => request<{ version: number; layout: MarketLayout }>('/api/admin/market-config/layout', jsonRequest('PUT', { layout, reason: '后台保存行情页面编排' })),
  searchMarketStocks: (keyword: string) => request<MarketStockSearchResult[]>(`/api/admin/market-stocks/search?keyword=${encodeURIComponent(keyword)}`),
  resolveMarketStock: (secid: string) => request<MarketStock>('/api/admin/market-stocks/resolve', jsonRequest('POST', { secid, reason: '后台从东财加入股票库' })),
  refreshMarketStock: (secid: string) => request<MarketStock>(`/api/admin/market-stocks/${encodeURIComponent(secid)}/refresh`, jsonRequest('PUT', { reason: '后台从东财刷新股票信息' })),
  deleteMarketStock: (secid: string) => request(`/api/admin/market-stocks/${encodeURIComponent(secid)}`, jsonRequest('DELETE', { reason: '后台删除未被引用的股票' })),
  auditLogs: (page: number, pageSize: number) => request<Paginated<AuditLog>>(`/api/admin/audit-logs?page=${page}&pageSize=${pageSize}`),
};

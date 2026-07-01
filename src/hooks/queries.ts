import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminRequest, jsonPatch } from '../services/api';
import {
  AuditLog,
  Changelog,
  DashboardSummary,
  FeedbackRow,
  HotFund,
  SystemConfig,
  UserRow,
} from '../types';

// ==========================================
// 1. Dashboard Hooks
// ==========================================
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => adminRequest<DashboardSummary>('/api/admin/dashboard/summary'),
  });
}

// ==========================================
// 2. Users Hooks
// ==========================================
export function useUsers(keyword: string, page: number, pageSize: number) {
  return useQuery<{ items: UserRow[]; total: number; page: number; pageSize: number }>({
    queryKey: ['users', keyword, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set('keyword', keyword);

      return adminRequest<{ items: UserRow[]; total: number; page: number; pageSize: number }>(
        `/api/admin/users?${params.toString()}`
      );
    },
    placeholderData: keepPreviousData,
  });
}

export function useUserDetail(openid: string | null) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['user-detail', openid],
    queryFn: async () => {
      if (!openid) return {};
      const [watchlist, holdings, transactions, feedback] = await Promise.all([
        adminRequest(`/api/admin/users/${openid}/watchlist`),
        adminRequest(`/api/admin/users/${openid}/holdings`),
        adminRequest(`/api/admin/users/${openid}/transactions`),
        adminRequest(`/api/admin/users/${openid}/feedback`),
      ]);
      return { watchlist, holdings, transactions, feedback };
    },
    enabled: !!openid,
  });
}

// ==========================================
// 3. Feedback Hooks
// ==========================================
export function useFeedbacks() {
  return useQuery<{ items: FeedbackRow[] }>({
    queryKey: ['feedbacks'],
    queryFn: () => adminRequest<{ items: FeedbackRow[] }>('/api/admin/feedback'),
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminRequest(`/api/admin/feedback/${id}`, jsonPatch('PUT', { status })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}

// ==========================================
// 4. Hot Funds Hooks
// ==========================================
export function useHotFunds() {
  return useQuery<HotFund[]>({
    queryKey: ['hot-funds'],
    queryFn: () => adminRequest<HotFund[]>('/api/admin/hot-funds'),
  });
}

export function useCreateHotFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: { fundCode: string; fundName: string; sortOrder: number }) =>
      adminRequest(
        '/api/admin/hot-funds',
        jsonPatch('POST', { ...form, reason: '后台新增热门基金' })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-funds'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}

export function useToggleHotFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: HotFund) =>
      adminRequest(
        `/api/admin/hot-funds/${item.id}`,
        jsonPatch('PUT', {
          fundCode: item.fund_code,
          fundName: item.fund_name,
          sortOrder: item.sort_order,
          isActive: !item.is_active,
          reason: '后台切换热门基金状态',
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-funds'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}

// ==========================================
// 5. Changelogs Hooks
// ==========================================
export function useChangelogs() {
  return useQuery<Changelog[]>({
    queryKey: ['changelogs'],
    queryFn: () => adminRequest<Changelog[]>('/api/admin/changelogs'),
  });
}

export function useUpdateChangelog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Changelog) =>
      adminRequest<Changelog>(
        '/api/admin/changelogs',
        jsonPatch('PUT', {
          id: item.id,
          version: item.version,
          publishDate: item.publish_date,
          isLatest: item.is_latest,
          details: item.details,
          reason: '后台编辑更新日志',
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelogs'] });
    },
  });
}

// ==========================================
// 6. System Configs Hooks
// ==========================================
export function useConfigs() {
  return useQuery<SystemConfig[]>({
    queryKey: ['configs'],
    queryFn: () => adminRequest<SystemConfig[]>('/api/admin/configs'),
  });
}

export function useToggleConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: SystemConfig) => {
      const nextValue = item.value === 'true' ? 'false' : 'true';
      return adminRequest(
        `/api/admin/configs/${item.key}`,
        jsonPatch('PUT', {
          value: nextValue,
          description: item.description,
          reason: `后台切换 ${item.key}`,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}

// ==========================================
// 7. Audit Logs Hooks
// ==========================================
export function useAuditLogs() {
  return useQuery<{ items: AuditLog[] }>({
    queryKey: ['audit-logs'],
    queryFn: () => adminRequest<{ items: AuditLog[] }>('/api/admin/audit-logs'),
  });
}

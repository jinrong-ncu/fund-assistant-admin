import type { ApiResponse, ApiErrorResponse } from '@/types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly details?: unknown;

  constructor(payload: ApiErrorResponse, status: number) {
    super(payload.message || '请求失败');
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = status;
    this.fieldErrors = payload.fieldErrors;
    this.details = payload.details;
  }
}

const TOKEN_KEY = 'fund_admin_token';

export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(path, { credentials: 'include', ...init, headers });
  } catch {
    throw new ApiError(
      {
        success: false,
        code: 'ERR_NETWORK',
        message: '网络连接异常，请检查网络后重试',
        timestamp: new Date().toISOString(),
      },
      0
    );
  }

  if (res.status === 401 || res.status === 419) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      clearAdminToken();
      window.location.href = '/login?expired=1';
    }
  }

  const payload = await res.json().catch(() => null);

  const isOk = res.ok && payload && (payload.code === 0 || payload.success === true);

  if (!isOk) {
    const errorPayload: ApiErrorResponse = {
      success: false,
      code: payload?.code ? String(payload.code) : `ERR_HTTP_${res.status}`,
      message: payload?.message || `请求失败 (${res.status})`,
      fieldErrors: payload?.fieldErrors,
      details: payload?.details,
      timestamp: new Date().toISOString(),
    };
    throw new ApiError(errorPayload, res.status);
  }

  return (payload as ApiResponse<T>).data;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'DELETE',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
};

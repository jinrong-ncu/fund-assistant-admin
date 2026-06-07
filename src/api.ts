export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  permissions: string[];
};

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.liujinrong.cn').replace(
  /\/$/,
  ''
);

const TOKEN_KEY = 'fund_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload.data;
}

export async function login(email: string, password: string) {
  const data = await adminRequest<{ token: string; admin: AdminUser }>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.admin;
}

export async function fetchMe() {
  return adminRequest<AdminUser>('/api/admin/auth/me');
}

export async function logout() {
  try {
    await adminRequest('/api/admin/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

export function jsonPatch(method: 'POST' | 'PUT' | 'DELETE', body?: unknown) {
  return {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}


import { request, jsonRequest } from './request';
import { AdminUser } from '../types';
import { clearToken, setToken, getToken } from './auth-storage';

export { clearToken, getToken } from './auth-storage';
export type { AdminUser } from '../types';
export type { ApiEnvelope } from './request';

export async function login(email: string, password: string): Promise<AdminUser> {
  const data = await request<{ token: string; admin: AdminUser }>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.admin;
}

export function fetchMe(): Promise<AdminUser> {
  return request<AdminUser>('/api/admin/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await request('/api/admin/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

export { jsonRequest };

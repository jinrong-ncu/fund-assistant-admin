const TOKEN_KEY = 'fund_admin_token';

export function getToken(): string {
  return typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

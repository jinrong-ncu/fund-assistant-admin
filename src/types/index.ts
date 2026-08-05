export type AdminUser = { id: string; email: string; name?: string | null; role?: string; permissions?: string[] };
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

export type DashboardSummary = {
  users: number;
  newUsersToday: number;
  holdingsUsers: number;
  watchlistUsers: number;
  feedback: { total: number; open: number };
  hotFundsActive: number;
  showMarketIndices: boolean;
  personalSafeMode: boolean;
};

export type HealthSummary = {
  timestamp: string;
  checks: Record<string, { ok: boolean; configured?: boolean; serviceRole?: boolean; optional?: boolean }>;
};

export type UserRow = {
  id: string;
  openid: string;
  user_code?: string;
  nickname?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  holdingsCount: number;
  watchlistCount: number;
  feedbackCount: number;
};

export type HoldingRow = Record<string, unknown> & { fund_code: string; fund_name: string; current_value?: number; cost_amount?: number; shares?: number; updated_at?: string };
export type WatchlistRow = Record<string, unknown> & { fund_code: string; fund_name: string; fund_type?: string; created_at?: string };
export type TransactionRow = Record<string, unknown> & { id: string; fund_code: string; transaction_type: string; trade_date: string; nav?: number; amount: number; cost_amount: number; shares: number; is_buy_point: boolean; remark?: string | null };

export type FeedbackRow = {
  id: string;
  openid: string;
  category: string;
  content: string;
  status: string;
  priority: string;
  admin_note?: string | null;
  created_at: string;
  nickname?: string | null;
  avatar_url?: string | null;
};

export type HotFund = { id: number; fund_code: string; fund_name: string; sort_order: number; is_active: boolean; created_at?: string; updated_at?: string };
export type ChangelogDetail = { type: string; content: string };
export type Changelog = { id: number; version: string; publish_date: string; is_latest: boolean; details: ChangelogDetail[] };
export type SystemConfig = { key: string; value: string; description?: string | null; updated_at?: string };
export type ResourceEntry = { id: string; category: 'community' | 'support'; channel: string; title: string; description?: string | null; image_url?: string | null; action_type: string; action_value?: string | null; enabled: boolean; sort_order: number };
export type AuditLog = { id: string; admin_id: string; action: string; target_type: string; target_id?: string | null; before_data?: unknown; after_data?: unknown; reason?: string | null; created_at: string; ip?: string | null };

export type UserDetails = {
  holdings: HoldingRow[];
  watchlist: WatchlistRow[];
  transactions: TransactionRow[];
  feedback: FeedbackRow[];
};

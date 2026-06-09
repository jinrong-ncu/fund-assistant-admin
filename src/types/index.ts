export type DashboardSummary = {
  users?: number;
  holdingsUsers?: number;
  watchlistUsers?: number;
  feedback?: { total: number; open: number };
  hotFundsActive?: number;
  showMarketIndices?: boolean;
  personalSafeMode?: boolean;
};

export type UserRow = {
  id: string;
  openid: string;
  nickname?: string;
  avatarUrl?: string;
  avatar_url?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  holdingsCount?: number;
  watchlistCount?: number;
  feedbackCount?: number;
};

export type FeedbackRow = {
  id: string;
  openid: string;
  category: string;
  content: string;
  status?: string;
  priority?: string;
  admin_note?: string | null;
  created_at: string;
  nickname?: string;
  avatar_url?: string | null;
};

export type HotFund = {
  id: number;
  fund_code: string;
  fund_name: string;
  sort_order: number;
  is_active: boolean;
};

export type Changelog = {
  id: number;
  version: string;
  publish_date: string;
  is_latest: boolean;
  details: Array<{ type: string; content: string }>;
};

export type SystemConfig = {
  key: string;
  value: string;
  description?: string | null;
};

export type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id?: string;
  reason?: string;
  created_at: string;
};

export type AdminRole = 'admin' | 'owner' | 'operator' | 'support' | 'developer' | 'readonly';

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role: AdminRole;
  permissions?: string[];
  createdAt?: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
};

export type DashboardSummary = {
  users: number;
  newUsersToday: number;
  holdingsUsers: number;
  watchlistUsers: number;
  feedback: { total: number; open: number };
  hotFundsActive: number;
  showMarketIndices: boolean;
  personalSafeMode: boolean;
  reviewMode: boolean;
  ocrEnabled: boolean;
};

export type HealthCheckItem = {
  ok: boolean;
  latencyMs?: number;
  configured?: boolean;
  serviceRole?: boolean;
  optional?: boolean;
  message?: string;
};

export type HealthSummary = {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  checks: Record<string, HealthCheckItem>;
};

export type UserRow = {
  id: string;
  openid: string;
  user_code?: string;
  nickname?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  last_active_at?: string | null;
  holdingsCount: number;
  watchlistCount: number;
  feedbackCount: number;
};

export type HoldingRow = {
  id?: string;
  fund_code: string;
  fund_name: string;
  current_value?: number;
  cost_amount?: number;
  shares?: number;
  updated_at?: string;
};

export type WatchlistRow = {
  id?: string;
  fund_code: string;
  fund_name: string;
  fund_type?: string;
  created_at?: string;
};

export type TransactionRow = {
  id: string;
  fund_code: string;
  transaction_type: 'buy' | 'sell';
  trade_date: string;
  nav?: number;
  amount: number;
  cost_amount: number;
  shares: number;
  is_buy_point: boolean;
  remark?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FeedbackStatus = 'open' | 'processing' | 'resolved' | 'ignored';
export type FeedbackPriority = 'low' | 'normal' | 'high';

export type FeedbackRow = {
  id: string;
  openid: string;
  category: string;
  content: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string;
  nickname?: string | null;
  avatar_url?: string | null;
};

export type HotFund = {
  id: number;
  fund_code: string;
  fund_name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ChangelogDetail = {
  type: 'feature' | 'fix' | 'perf' | 'other';
  content: string;
};

export type Changelog = {
  id: number;
  version: string;
  publish_date: string;
  is_latest: boolean;
  details: ChangelogDetail[];
  created_at?: string;
  updated_at?: string;
};

export type SystemConfig = {
  key: string;
  value: string;
  description?: string | null;
  updated_at?: string;
};

export type ResourceEntry = {
  id: string;
  category: 'community' | 'support';
  channel: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  action_type: 'preview_image' | 'copy_text' | 'navigate';
  action_value?: string | null;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type AuditLog = {
  id: string;
  admin_id?: string;
  admin_email?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  before_data?: unknown;
  after_data?: unknown;
  reason: string;
  created_at: string;
  ip?: string | null;
};

export type MarketStock = {
  secid: string;
  code: string;
  market: number;
  name: string;
  exchange: string;
  securityType: string;
  sourceUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketStockSearchResult = Pick<
  MarketStock,
  'secid' | 'code' | 'market' | 'name' | 'exchange' | 'securityType'
>;

export type MarketTickerLayout = {
  secid: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
};

export type MarketModuleLayout = {
  id: string;
  title: string;
  icon: string;
  type: 'DIRECT' | 'AVERAGE';
  enabled: boolean;
  sortOrder: number;
  stockSecids: string[];
};

export type MarketSectionLayout = {
  id: string;
  title: string;
  enabled: boolean;
  sortOrder: number;
  modules: MarketModuleLayout[];
};

export type MarketTabLayout = {
  key: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
  sections: MarketSectionLayout[];
};

export type MarketLayout = {
  defaultTabKey: string;
  tickers: MarketTickerLayout[];
  tabs: MarketTabLayout[];
};

export type AdminMarketConfig = {
  version: number;
  stocks: MarketStock[];
  layout: MarketLayout;
};

export type UserDetails = {
  holdings: HoldingRow[];
  watchlist: WatchlistRow[];
  transactions: TransactionRow[];
  feedback: FeedbackRow[];
};

// API Standard Envelope
export type ApiResponse<T> = {
  success: true;
  code: 0;
  message: string;
  data: T;
  timestamp: string;
};

export type ApiErrorResponse = {
  success: false;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: unknown;
  timestamp: string;
};

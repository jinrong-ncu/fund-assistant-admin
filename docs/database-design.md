# 估值助手管理后台 V2 数据库设计规范 (Database Design)

## 1. 数据库选型与定位

本系统继续使用 **Supabase 托管的 PostgreSQL** 作为权威数据源，但在应用开发层，全面使用 **Drizzle ORM** 替代裸 SDK / SQL 字符串，实现完整的 TypeScript 类型安全、强约束校验及无损迁移管理（Drizzle Kit）。

---

## 2. 核心数据表结构与 Drizzle Schema

### 2.1 管理员与权限体系 (`admin_users`)
用于后台管理系统的独立身份认证与角色控制，彻底解耦业务小程序用户与管理人员。
```typescript
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').$type<'admin' | 'operator' | 'readonly'>().default('operator').notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 2.2 用户体系与资产模型
#### 用户主表 (`users`)
```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  openid: text('openid').notNull().unique(),
  userCode: text('user_code').unique(),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 持仓汇总表 (`holdings`)
```typescript
import { numeric, index } from 'drizzle-orm/pg-core';

export const holdings = pgTable('holdings', {
  id: uuid('id').defaultRandom().primaryKey(),
  openid: text('openid').notNull().references(() => users.openid, { onDelete: 'cascade' }),
  fundCode: text('fund_code').notNull(),
  fundName: text('fund_name').notNull(),
  currentValue: numeric('current_value', { precision: 14, scale: 2 }).default('0.00'),
  costAmount: numeric('cost_amount', { precision: 14, scale: 2 }).default('0.00'),
  shares: numeric('shares', { precision: 14, scale: 2 }).default('0.00'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_holdings_openid').on(table.openid),
  index('idx_holdings_fund_code').on(table.fundCode),
]);
```

#### 交易流水明细表 (`transactions`)
```typescript
import { boolean, date } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  openid: text('openid').notNull().references(() => users.openid, { onDelete: 'cascade' }),
  fundCode: text('fund_code').notNull(),
  transactionType: text('transaction_type').$type<'buy' | 'sell'>().notNull(),
  tradeDate: date('trade_date').notNull(),
  nav: numeric('nav', { precision: 10, scale: 4 }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  costAmount: numeric('cost_amount', { precision: 14, scale: 2 }).notNull(),
  shares: numeric('shares', { precision: 14, scale: 2 }).notNull(),
  isBuyPoint: boolean('is_buy_point').default(false).notNull(),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_transactions_openid_fund').on(table.openid, table.fundCode),
  index('idx_transactions_trade_date').on(table.tradeDate),
]);
```

#### 自选关注表 (`watchlist`)
```typescript
export const watchlist = pgTable('watchlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  openid: text('openid').notNull().references(() => users.openid, { onDelete: 'cascade' }),
  fundCode: text('fund_code').notNull(),
  fundName: text('fund_name').notNull(),
  fundType: text('fund_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_watchlist_openid').on(table.openid),
]);
```

### 2.3 反馈工单表 (`feedback`)
```typescript
export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  openid: text('openid').notNull().references(() => users.openid, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  content: text('content').notNull(),
  status: text('status').$type<'open' | 'processing' | 'resolved' | 'ignored'>().default('open').notNull(),
  priority: text('priority').$type<'low' | 'normal' | 'high'>().default('normal').notNull(),
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_feedback_status_priority').on(table.status, table.priority),
]);
```

### 2.4 运营内容中心模型
#### 热门基金配置 (`hot_funds`)
```typescript
import { serial, integer } from 'drizzle-orm/pg-core';

export const hotFunds = pgTable('hot_funds', {
  id: serial('id').primaryKey(),
  fundCode: text('fund_code').notNull().unique(),
  fundName: text('fund_name').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 版本更新日志 (`changelogs`)
```typescript
export const changelogs = pgTable('changelogs', {
  id: serial('id').primaryKey(),
  version: text('version').notNull().unique(),
  publishDate: date('publish_date').notNull(),
  isLatest: boolean('is_latest').default(false).notNull(),
  details: jsonb('details').$type<Array<{ type: string; content: string }>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 交流与支持资源 (`resources`)
```typescript
export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: text('category').$type<'community' | 'support'>().notNull(),
  channel: text('channel').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  actionType: text('action_type').$type<'preview_image' | 'copy_text' | 'navigate'>().notNull(),
  actionValue: text('action_value'),
  enabled: boolean('enabled').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 2.5 行情股票库与布局快照模型
#### 行情股票库 (`market_stocks`)
权威记录来自东财的证券标的。
```typescript
export const marketStocks = pgTable('market_stocks', {
  secid: text('secid').primaryKey(), // 唯一主键，例如 "0.399001", "100.NVDA"
  code: text('code').notNull(),
  market: integer('market').notNull(),
  name: text('name').notNull(),
  exchange: text('exchange').notNull(),
  securityType: text('security_type').notNull(),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### 行情页面布局版本快照 (`market_layouts`)
保证全量版本化发布与原子生效。
```typescript
import type { MarketLayout } from '@/types';

export const marketLayouts = pgTable('market_layouts', {
  version: integer('version').primaryKey(),
  layout: jsonb('layout').$type<MarketLayout>().notNull(),
  status: text('status').$type<'published' | 'draft'>().default('published').notNull(),
  createdBy: uuid('created_by').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 2.6 系统配置表 (`system_configs`)
```typescript
export const systemConfigs = pgTable('system_configs', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### 2.7 操作审计日志表 (`audit_logs`)
数据只增不改不删（Append-only）。
```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => adminUsers.id),
  adminEmail: text('admin_email'),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  reason: text('reason').notNull(),
  ip: text('ip'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_created_at').on(table.createdAt),
]);
```

---

## 3. 业务完整性约束与数据库触发器

1. **版本日志全局唯一最新版本约束**：
   * 在变更 `changelogs` 设置 `is_latest = true` 时，服务端在数据库事务中使用锁或更新前置，执行：
     `UPDATE changelogs SET is_latest = false WHERE id <> :currentId;`
2. **流水修改/删除事务保障**：
   * 在单个 `db.transaction()` 内依次执行：
     1. 更新或删除指定流水；
     2. 聚合该用户的该基金剩余所有流水，重新计算 `shares`、`costAmount`、`currentValue`；
     3. 更新 `holdings` 对应行（若份额归零可做清空或标记）；
     4. 插入 `audit_logs` 记录。
3. **股票标的删除时的外键与 JSON 引用检测**：
   * 在删除 `market_stocks` 前，查询最新的 `market_layouts`，遍历提取引用的所有 `secid`。若命中，则拒绝删除并列出引用模块。

# 估值助手管理后台 V2 API 接口设计规范 (API Design)

## 1. 总体设计原则

* **协议与风格**：统一采用 RESTful 风格，通过 Next.js App Router Route Handlers (`src/app/api/admin/*`) 提供服务。
* **数据格式**：所有请求体与响应体均为 `application/json; charset=utf-8`。
* **参数校验**：全量使用 **Zod Schema** 进行服务端严密校验，且该 Schema 与前端 React Hook Form 共享，保证前后端数据契约绝对一致。
* **身份与鉴权**：请求头携带基于 HTTP-only Cookie 的 Session，并在中间件提取当前管理员主体信息（`adminId`, `role`, `email`, `ip`）。

---

## 2. 统一响应规范与错误码

### 2.1 成功响应封套
```json
{
  "success": true,
  "code": 0,
  "message": "操作成功",
  "data": { ... },
  "timestamp": "2026-09-20T08:15:00.000Z"
}
```

### 2.2 错误响应封套
```json
{
  "success": false,
  "code": "ERR_STOCK_REFERENCED",
  "message": "该股票正在被模块引用，无法直接删除",
  "fieldErrors": {},
  "details": {
    "secid": "0.399001",
    "referencedIn": ["顶部指标: 深圳成指", "Tab: 宽基指数 -> 分组: 核心指数 -> 模块: 成指走势"]
  },
  "timestamp": "2026-09-20T08:15:00.000Z"
}
```

### 2.3 核心业务错误码字典
* `ERR_UNAUTHORIZED` (401): 未登录或登录态过期
* `ERR_FORBIDDEN` (403): 当前角色无权执行此操作
* `ERR_VALIDATION_FAILED` (422): 表单参数校验未通过（附带 `fieldErrors`）
* `ERR_REASON_REQUIRED` (400): 敏感写操作未提供变更原因
* `ERR_STOCK_REFERENCED` (409): 股票标的正被行情编排引用，拒绝删除
* `ERR_RECALCULATE_FAILED` (500): 持仓重新计算流水异常
* `ERR_INTERNAL_SERVER` (500): 服务端未知内部异常

---

## 3. 核心 API 接口清单与详细契约

### 3.1 鉴权中心 (`/api/admin/auth/*`)
* `POST /api/admin/auth/login`
  * 入参：`{ email: string, password: string }` (Zod `loginSchema`)
  * 返回：`{ admin: AdminUser }`（同时在响应头通过 `Set-Cookie` 下发安全 Session）
* `GET /api/admin/auth/me`
  * 返回当前登录管理员信息及角色权限列表
* `POST /api/admin/auth/logout`
  * 注销并清除 Cookie

### 3.2 概览与健康监控
* `GET /api/admin/dashboard/summary`
  * 返回核心指标统计卡片数据与关键开关状态快照
* `GET /api/admin/health`
  * 深度巡检 API、Supabase PostgreSQL、Redis 服务的连通延迟与状态

### 3.3 用户与资产治理 (`/api/admin/users/*`)
* `GET /api/admin/users`
  * 查询参数：`page`, `pageSize`, `search`（支持昵称/编号/openid）
  * 返回：`{ items: UserRow[], total: number, page: number, pageSize: number }`
* `GET /api/admin/users/:openid/holdings`
  * 返回指定用户持仓汇总列表
* `GET /api/admin/users/:openid/transactions`
  * 返回指定用户的全部交易流水记录
* `GET /api/admin/users/:openid/watchlist`
  * 返回指定用户的自选关注基金列表
* `GET /api/admin/users/:openid/feedback`
  * 返回指定用户的历史反馈工单
* `PUT /api/admin/transactions/:id`
  * **事务性写操作**：
    * 入参：`{ tradeDate, transactionType, amount, costAmount, shares, nav, remark, reason }`
    * 业务逻辑：单一数据库事务中更新指定流水行 -> 聚合该用户该标的全量流水并重算持仓 -> 更新 `holdings` -> 写入 `audit_logs`。
* `DELETE /api/admin/transactions/:id`
  * **事务性写操作**：
    * 入参：`{ reason: string }`
    * 业务逻辑：物理删除该流水 -> 重新触发该标的持仓汇总聚合 -> 写入 `audit_logs`。
* `POST /api/admin/holdings/recalculate`
  * **高危重算操作**：
    * 入参：`{ openid: string, fundCode: string, reason: string }`
    * 业务逻辑：依据用户全量历史流水重构该基金的持仓数据并原子更新，全程记录审计。

### 3.4 反馈处理工单 (`/api/admin/feedback/*`)
* `GET /api/admin/feedback`
  * 查询参数：`status`, `priority`, `page`, `pageSize`
* `PUT /api/admin/feedback/:id`
  * 入参：`{ status?: string, priority?: string, adminNote?: string }`
  * 业务逻辑：流转工单状态，记录处理备注，自动产生审计日志。

### 3.5 运营中心 (`/api/admin/operations/*`)
* **热门推荐**：
  * `GET /api/admin/hot-funds`
  * `POST /api/admin/hot-funds` (入参：`{ fundCode, fundName, sortOrder, isActive, reason }`)
  * `PUT /api/admin/hot-funds/:id`
  * `DELETE /api/admin/hot-funds/:id` (入参：`{ reason }`)
* **版本更新日志**：
  * `GET /api/admin/changelogs`
  * `POST /api/admin/changelogs` (入参：`{ version, publishDate, isLatest, details: Array<{type, content}>, reason }`)
  * `PUT /api/admin/changelogs/:id`
  * `DELETE /api/admin/changelogs/:id` (入参：`{ reason }`)
  * *业务保障：当 `isLatest = true` 时，服务端自动在事务内排他更新其他条目。*
* **交流与支持资源**：
  * `GET /api/admin/resources`
  * `POST /api/admin/resources` (入参：`{ category, channel, title, description, imageUrl, actionType, actionValue, sortOrder, enabled, reason }`)
  * `PUT /api/admin/resources/:id`
  * `DELETE /api/admin/resources/:id` (入参：`{ reason }`)

### 3.6 行情配置与股票库 (`/api/admin/market/*`)
* `GET /api/admin/market/stocks/search?keyword=:keyword`
  * 服务端实时调用东方财富接口返回候选证券列表。
* `POST /api/admin/market/stocks/resolve`
  * 入参：`{ secid: string, reason: string }`
  * 服务端向东财抓取官方权威字段并写入 `market_stocks`，记录审计。
* `PUT /api/admin/market/stocks/:secid/refresh`
  * 从东财重新同步标的中文名和市场属性。
* `DELETE /api/admin/market/stocks/:secid`
  * **删除引用校验**：服务端扫描最新 `market_layouts`，如果被 `tickers` 或任意 `module` 引用，返回 `409` 及引用详情；若未被引用，安全删除并记录审计。
* `GET /api/admin/market/layout`
  * 返回当前已发布的最新布局以及当前正在编辑的草稿（如有）。
* `PUT /api/admin/market/layout/draft`
  * 暂存未发布草稿。
* `POST /api/admin/market/layout/publish`
  * **原子化全量发布**：
    * 入参：`{ layout: MarketLayout, reason: string }`
    * 逻辑：完整 Schema 结构校验 -> 校验每个模块证券有效性 -> 获取当前最新 version + 1 -> 插入新版本记录 -> 标记发布成功 -> 写入审计快照。

### 3.7 系统设置与提审治理 (`/api/admin/system/*`)
* `GET /api/admin/system/configs`
  * 获取系统所有配置键值。
* `PUT /api/admin/system/configs/:key`
  * 入参：`{ value: string, description?: string, reason: string }`
  * 写入系统配置，自动关联审计记录。

### 3.8 操作审计日志 (`/api/admin/audit/*`)
* `GET /api/admin/audit-logs`
  * 查询参数：`page`, `pageSize`, `action`, `targetType`, `startDate`, `endDate`
  * 返回审计日志明细，包含修改前快照 `before_data` 与修改后快照 `after_data`。

# 现有系统审计与业务事实分析 (Current System Audit)

本文档对现有的 `fund-assistant-admin`（React 19 + Vite + Ant Design 5）及其对接的后端服务能力进行全方位代码审计，提炼已有业务语义、数据字段、隐蔽规则及技术债。

---

## 1. 现有技术栈与项目边界

* **构建与运行环境**：Vite 8.0 + React 19.0 + TypeScript 5.7 + Ant Design 6.1 (兼容 5.x API)。
* **数据流与路由**：`@tanstack/react-query` v5.62 + `react-router-dom` v7.1 (基于 `createHashRouter`)。
* **服务端与网络代理**：
  * 开发环境通过 `vite.config.ts` 将 `/api` 请求代理到后端服务 `http://localhost:3000`（原 `fund-assistant` 项目）。
  * 生产环境通过环境变量 `VITE_API_BASE_URL`（默认指向 `https://api.liujinrong.cn`）进行跨域或反向代理调用。
  * 认证采用 Bearer Token 形式，Token 保存在 LocalStorage（`admin_token`），通过自定义事件 `admin:session-expired` 实现 401 自动拦截与登出跳转。

---

## 2. 核心页面与 API 依赖矩阵

| 页面组件 | 对应路由 | 依赖的 Backend API 接口 | 核心交互与能力 |
| :--- | :--- | :--- | :--- |
| `LoginPage.tsx` | `/login` | `POST /api/admin/auth/login`<br>`GET /api/admin/auth/me`<br>`POST /api/admin/auth/logout` | 邮箱密码登录、Token 本地存储、获取管理员信息、退出并清除 Token |
| `DashboardPage.tsx` | `/` | `GET /api/admin/dashboard/summary`<br>`GET /api/admin/health` | 统计卡片渲染、每 60 秒自动健康轮询、行情指数与安全模式状态只读展示 |
| `UsersPage.tsx` | `/users` | `GET /api/admin/users`<br>`GET /api/admin/users/:openid/holdings`<br>`GET /api/admin/users/:openid/watchlist`<br>`GET /api/admin/users/:openid/transactions`<br>`GET /api/admin/users/:openid/feedback`<br>`PUT /api/admin/transactions/:id`<br>`DELETE /api/admin/transactions/:id`<br>`POST /api/admin/holdings/recalculate` | 用户搜索（openid/编号/昵称）、分页展示、侧滑抽屉展示 4 个子 Tab、编辑/删除流水（输入原因）、重新计算持仓记录 |
| `FeedbackPage.tsx` | `/feedback` | `GET /api/admin/feedback`<br>`PUT /api/admin/feedback/:id` | 按状态过滤反馈列表、修改工单状态（open/processing/resolved/ignored）、优先级（low/normal/high）、填写管理员处理备注（最长 500 字） |
| `ContentPage.tsx` | `/content` | `GET/POST/PUT/DELETE /api/admin/hot-funds`<br>`GET/POST/PUT/DELETE /api/admin/changelogs`<br>`GET/POST/PUT/DELETE /api/admin/resources` | 热门基金增删改查、版本日志多行拆分解析增删改查（isLatest 标识）、支持社群与赞赏资源配置（点击动作与动态值） |
| `MarketConfigPage.tsx`| `/market` | `GET /api/admin/market-config`<br>`PUT /api/admin/market-config/layout`<br>`GET /api/admin/market-stocks/search`<br>`POST /api/admin/market-stocks/resolve`<br>`PUT /api/admin/market-stocks/:secid/refresh`<br>`DELETE /api/admin/market-stocks/:secid` | 东财搜索联想、东财入库解析、从东财刷新股票元数据、引用校验安全删除、页面布局三级编排（Tickers, Tabs, Sections, Modules）、草稿脏标记、全量版本化提交 |
| `SettingsPage.tsx` | `/settings` | `GET /api/admin/configs`<br>`PUT /api/admin/configs/:key`<br>`GET /api/admin/health` | 核心业务开关维护（提审模式、安全模式、OCR、行情指数等，提审模式带 Popconfirm 防误触）、资源 URL 维护、通用 K-V 配置回车更新、服务健康检查面板 |
| `AuditPage.tsx` | `/audit` | `GET /api/admin/audit-logs` | 分页查看全站后台操作记录、抽屉查看变动前 `before_data` 与变动后 `after_data` JSON 快照 |

---

## 3. 提取的关键业务字段与契约模型

### 3.1 用户数据与流水持仓模型
* **用户 (UserRow)**：
  `{ id, openid, user_code, nickname, avatar_url, created_at, updated_at, holdingsCount, watchlistCount, feedbackCount }`
* **持仓记录 (HoldingRow)**：
  `{ fund_code, fund_name, current_value, cost_amount, shares, updated_at }`
* **交易流水 (TransactionRow)**：
  `{ id, fund_code, transaction_type ('buy'|'sell'), trade_date, nav, amount, cost_amount, shares, is_buy_point, remark }`

### 3.2 行情配置与股票库模型
* **股票标的 (MarketStock)**：
  `{ secid, code, market (数字), name, exchange, securityType, sourceUpdatedAt, createdAt, updatedAt }`
* **页面编排结构 (MarketLayout)**：
  * `defaultTabKey`: 默认选中的 Tab 标识。
  * `tickers`: 顶部行情指标数组 `[{ secid, label, enabled, sortOrder }]`。
  * `tabs`: 标签页数组 `[{ key, label, enabled, sortOrder, sections: [{ id, title, enabled, sortOrder, modules: [{ id, title, icon, type ('DIRECT'|'AVERAGE'), enabled, sortOrder, stockSecids: string[] }] }] }]`。

### 3.3 审计日志模型 (AuditLog)
`{ id, admin_id, action, target_type, target_id, before_data, after_data, reason, created_at, ip }`
已定义的 action 映射包括：
* 流水与持仓：`transaction.update`, `transaction.delete`, `holding.recalculate`
* 反馈工单：`feedback.update`
* 运营内容：`hot_fund.create`, `hot_fund.update`, `hot_fund.delete`, `changelog.create`, `changelog.update`, `changelog.delete`, `resource.create`, `resource.update`, `resource.delete`
* 系统配置：`config.upsert`
* 行情系统：`market.layout.update`, `market.stock.create`, `market.stock.refresh`, `market.stock.delete`

---

## 4. 隐藏业务规则与边界约束 (Hidden Business Rules)

1. **东财股票库权威性**：
   * 前端禁止手工录入或修改股票名称、交易所和市场代码。必须由后端调用东方财富接口解析并持久化，保证 `secid`、`code`、`market` 三位一体的准确性。
2. **股票删除引用强约束 (Referential Integrity Check)**：
   * 股票标的若仍然在当前生效或草稿中的 `tickers` 或任意 `module.stockSecids` 中被引用，后端必须拒绝删除，且必须返回具体的引用模块名，不能单纯报错。
3. **行情编排模块类型校验**：
   * `DIRECT`（单标的直读）：必须且只能绑定 1 只股票。
   * `AVERAGE`（成分平均）：至少需要绑定 2 只成分股票。
4. **行情发布的原子性与版本号自增**：
   * 行情编排不能做单个 Tab 或单个 Module 的局部 patch 更新。保存编排时，全量提交整个 `MarketLayout`，服务端整体验证并递增 `version`，写入审计快照，保证小程序端不会出现半更新状态。
5. **版本更新日志单一最新限制 (Single Latest Constraint)**：
   * 全系统发布的所有版本日志中，标记为 `is_latest = true` 的最多只能有 1 条。新增或更新为最新版本时，其他历史版本必须自动取消 `is_latest`。
6. **流水修改/删除连带持仓重算 (Cascade Recalculation)**：
   * 修改或删除交易流水时，旧系统是分开先调用修改流水接口，再由前端触发刷新，实际在后台逻辑中，流水变动必须联动该标的的持仓汇总重新计算，并作为单个数据库事务提交。
7. **写操作强制提供 reason (Audit Reason Enforced)**：
   * 流水修改/删除、持仓重算、配置修改、股票库操作等均必须传递 `reason` 字段，作为审计追踪的直接依据。

---

## 5. 发现的技术债与重写风险 (Technical Debt & Migration Risks)

1. **单一页面体积庞大**：旧版 `MarketConfigPage.tsx` 接近 500 行，将东财搜索、股票池列表、顶部指标编辑器、三级折叠嵌套树全部堆叠在单文件中，状态混乱，易产生浅拷贝污染。
2. **样式严重依赖 Ant Design 内部类名覆盖**：旧版 `styles.css` 大量使用 `.ant-table`, `.ant-card-head`, `.ant-layout-sider` 强制 override，深色模式适配极其脆弱。
3. **无正式的 Admin 账户体系与细粒度权限控制**：当前后台仅有单一硬编码管理员概念，无法支撑多角色（管理员、运营、审计员）隔离。
4. **前端直接负责部分业务完整性校验**：例如股票引用的前端判断、JSON 序列化解析等，服务端缺乏统一的 Zod Schema 校验与清晰的业务异常错误码规范。
5. **缺少结构化审计 Diff 工具**：旧版操作记录详情仅是两个纯文本 `<pre>` 标签，难以快速看出到底修改了哪个具体字段。

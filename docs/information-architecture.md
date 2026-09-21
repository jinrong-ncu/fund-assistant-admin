# 估值助手管理后台 V2 信息架构设计 (Information Architecture)

## 1. 信息架构重构原则

旧版后台将多个高维功能合并在单个页面中（如将热门内容、版本日志、交流资源揉在同一个 `ContentPage`，将东财股票池与复杂编排混在一个 `MarketConfigPage`，系统设置与健康检查混在一个 `SettingsPage`），导致操作路径模糊、表单互相干扰且页面代码臃肿。

V2 按照 **高内聚、低耦合、语义清晰、职责分明** 的原则，将导航与路由重新梳理为五大功能集群：

```text
Overview (概览)
  └── Dashboard (工作台)

Users & Engagement (用户与互动)
  ├── Users (用户数据)
  └── Feedback (反馈处理)

Operations (运营中心)
  ├── Hot Funds (热门内容)
  ├── Changelog (版本日志)
  └── Resources (交流与支持)

Market Engine (行情引擎)
  ├── Stock Pool (股票标的库)
  └── Layout Builder (页面布局编排)

System & Governance (系统与治理)
  ├── Settings (系统设置)
  ├── System Health (服务健康)
  └── Audit Logs (操作审计)
```

---

## 2. 完整路由结构与页面职能矩阵

| 导航分组 | 路由路径 (`pathname`) | 页面中文名 | 核心组件与交互形态 | 主要职能与承载内容 |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** | `/` (或 `/dashboard`) | 工作台 | `DashboardPage` | 关键指标卡片 (MetricCard)、服务健康概览、小程序核心开关快照 |
| **Users** | `/users` | 用户数据 | `UsersPage`<br>`+ UserDetailSheet` | 用户列表检索与分页；右侧侧滑大抽屉查看持仓、流水（支持编辑/删除）、关注及反馈 |
| **Users** | `/feedback` | 反馈处理 | `FeedbackPage`<br>`+ FeedbackModal` | 反馈工单列表、状态与优先级筛选、流转处理与管理员 500 字备注回填 |
| **Operations** | `/operations/hot-funds` | 热门内容 | `HotFundsPage` | 热门推荐基金的增删改查、即时启用/停用与权重排序 |
| **Operations** | `/operations/changelog` | 版本日志 | `ChangelogPage` | 小程序更新动态管理、多行特性条目录入、最新版本排他标记 |
| **Operations** | `/operations/resources` | 交流与支持 | `ResourcesPage` | 社群加入二维码、支持作者赞赏配置、跳转与预览动作分发 |
| **Market** | `/market/stock-pool` | 股票标的库 | `StockPoolPage` | 东方财富证券实时搜索联想、一键入库、标的刷新、防误删引用校验 |
| **Market** | `/market/layout-builder`| 页面编排器 | `LayoutBuilderPage` | 顶部行情指标、Tab 标签、Section 分组、Module 模块四级编排；草稿暂存与原子化发布 |
| **System** | `/system/settings` | 系统设置 | `SettingsPage` | 提审模式（高风险二次确认）、安全模式、OCR 开关、动态资源图片及通用 K-V 配置 |
| **System** | `/system/health` | 服务健康 | `HealthPage` | API 服务、Supabase PostgreSQL、Redis 缓存服务延迟、状态与权限详细检测 |
| **System** | `/system/audit` | 操作审计 | `AuditPage`<br>`+ AuditDetailSheet` | 全站敏感写操作历史留痕、过滤筛选、变更前后的结构化 JSON Diff 查看 |
| **Auth** | `/login` | 管理员登录 | `LoginPage` | 管理员账号登录鉴权（支持邮箱与密码） |

---

## 3. URL 状态驱动原则 (URL as Single Source of Truth)

为了支持管理员在日常操作中刷新页面、浏览器前进/后退、多标签并发排查以及同事间直接共享链接，所有查询与筛选状态必须双向同步至 URL Search Params：

### 3.1 用户页面 (`/users`)
* `page`: 当前页码（默认 `1`）
* `pageSize`: 每页条数（默认 `20`）
* `search`: 检索关键字（支持 openid / 用户编号 / 昵称）
* `userId` (可选): 若携带此参数，页面初次渲染时自动弹出对应用户的 `UserDetailSheet`

### 3.2 反馈页面 (`/feedback`)
* `status`: 状态过滤（`all`, `open`, `processing`, `resolved`, `ignored`）
* `priority`: 优先级过滤（`all`, `low`, `normal`, `high`）
* `page`, `pageSize`

### 3.3 审计日志页面 (`/system/audit`)
* `action`: 动作类型过滤（如 `transaction.update`, `market.layout.update` 等）
* `targetType`: 资源类型过滤（如 `transaction`, `market_stock`, `system_config` 等）
* `startDate`, `endDate`: 审计时间跨度筛选
* `page`, `pageSize`

---

## 4. 模态与侧滑交互规范 (Modals vs. Sheets)

1. **复杂全景画像使用 Sheet (侧滑抽屉)**：
   * 用户详情（`UserDetailSheet`）与操作审计详情（`AuditDetailSheet`）采用右侧滑出的大尺寸 Sheet（Desktop 占据 680px - 800px 宽度，Mobile 占满 100% 宽度）。
   * 优势：用户在查阅持仓明细和流水时，左侧底表依然保持上下文可见，极大降低迷失感。
2. **聚焦任务使用 Dialog (居中对话框)**：
   * 单条交易流水编辑、反馈流转处理、热门内容新增、股票入库确认等表单采用中等尺寸的 `Dialog`（宽度 520px - 600px）。
3. **高风险阻断使用 AlertDialog (确认警告框)**：
   * 提审模式开启、流水删除、持仓全量重算、未保存草稿放弃等不可逆或高危动作，使用 `AlertDialog`，突出警示背景，并强制管理员确认或录入变更原因。

---

## 5. 响应式布局与断点策略

后台遵循 **Desktop-first, Mobile-operable** 的现代企业级设计：
* **Desktop (≥ 1024px, `lg`)**：
  * 左侧常驻固定侧边栏（宽度 240px），支持快捷折叠为迷你图标模式（Icon Only，宽度 68px）。
  * 顶部 Header 包含轻量面包屑导航、全局主题切换（Light/Dark）与管理员头像菜单。
* **Tablet (768px - 1023px, `md`)**：
  * 侧边栏默认收起，点击 Header 左侧汉堡菜单弹出覆盖式 Sheet 导航。
  * 表格保持密集模式（Dense），关键列锁定，非核心列自适应横向滚动。
* **Mobile (< 768px, `sm`)**：
  * 专为开发者紧急运维巡检优化（例如手机端快速开启 `review_mode` 提审模式，或修改关键配置）。
  * 侧边栏完全收敛于左侧弹出抽屉。
  * 用户详情由侧滑抽屉自动升格为全屏覆盖式 Sheet。

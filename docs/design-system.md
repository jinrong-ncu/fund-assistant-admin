# 估值助手管理后台 V2 设计系统规范 (Design System)

## 1. 核心设计哲学 (Design Philosophy)

本设计系统参考 **shadcnuikit** 现代企业级管理后台风格，专为金融工具管理场景量身打造，恪守以下六大准则：

1. **Clean & Neutral (克制中性)**：以中性灰色系作为基底，避免高饱和度的大面积侵扰，让数据内容成为视觉焦点。
2. **Dense but Readable (紧凑高密且易读)**：控制表格、表单和卡片内边距，减少无效留白，提高信息密度与桌面端操作效率。
3. **Low Visual Noise (低视觉噪音)**：坚决摒弃营销类 SaaS 常见的巨型圆角、强渐变背景、毛玻璃拟态与夸张弥散阴影；所有视觉层级完全由 Typography、精细边框（Borders）、Muted 背景及语义化徽标（Semantic Badges）支撑。
4. **Data-Oriented (数据优先)**：金额、份额、持仓净值、统计数字统一采用等宽/表格数字（`font-variant-numeric: tabular-nums`），保障排版对齐与可读性。
5. **Strict Tokenization (全面 Token 化)**：全站禁止硬编码 hex / rgb 颜色，所有色彩、边框、圆角和阴影必须绑定 CSS 变量。
6. **Dark / Light First-Class (原生双主题)**：通过 `next-themes` 实现零闪烁无缝深浅色模式切换。

---

## 2. 设计令牌 (Tokens Specification)

### 2.1 颜色令牌体系 (Semantic Color Tokens)
基于 Tailwind CSS v4 与 CSS Custom Properties (`hsl` / `oklch`)：

| 语义 Token | Light Mode 说明 | Dark Mode 说明 | 典型应用场景 |
| :--- | :--- | :--- | :--- |
| `--background` | `hsl(0, 0%, 100%)` 纯白底色 | `hsl(240, 10%, 3.9%)` 深灰黑 | 页面主背景 |
| `--foreground` | `hsl(240, 10%, 3.9%)` 近黑 | `hsl(0, 0%, 98%)` 亮白文本 | 一级文本、主要标题 |
| `--card` / `--card-foreground` | `hsl(0, 0%, 100%)` | `hsl(240, 10%, 4.5%)` | MetricCard、内容面板容器 |
| `--muted` / `--muted-foreground` | `hsl(240, 4.8%, 95.9%)` | `hsl(240, 3.7%, 15.9%)` | 次要背景、辅助说明文案、表头 |
| `--border` | `hsl(240, 5.9%, 90%)` | `hsl(240, 3.7%, 18%)` | 卡片边框、表格分割线、输入框外框 |
| `--primary` / `--primary-foreground`| `hsl(221, 83%, 53%)` 稳重蓝 | `hsl(217, 91%, 60%)` 柔和蓝 | 主操作按钮、高亮激活态、重要标识 |
| `--destructive` | `hsl(0, 84%, 60%)` 警示红 | `hsl(0, 62%, 30%)` | 危险删除、异常告警、阻断操作 |
| `--success` | `hsl(142, 71%, 45%)` 稳健绿 | `hsl(142, 69%, 36%)` | 正常运行状态、买入、已解决工单 |
| `--warning` | `hsl(38, 92%, 50%)` 警示橙 | `hsl(48, 96%, 40%)` | 提审模式警告、脏草稿状态、处理中 |

### 2.2 圆角与阴影规范 (Radius & Shadows)
* `--radius: 0.5rem` (8px)
  * 卡片、Dialog、Sheet、Dropdown、Button 统一使用 `rounded-lg` (8px) 或 `rounded-md` (6px)。
  * 严禁使用大于 16px 的巨大圆角。
* **阴影规范**：
  * 全站默认容器使用 `shadow-none` + `border border-border`。
  * 悬浮浮层（DropdownMenu, Popover, Dialog）使用克制的微阴影 `shadow-sm` 或 `shadow-md`。

### 2.3 字体与排版 (Typography)
* **字体族**：
  `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";`
* **金额与数字排版**：
  针对所有表格金额列、指标卡数值使用专门类名 `.tabular-nums`，强制启用 `font-feature-settings: "tnum"`。

---

## 3. 核心布局规格 (Layout Dimensions)

* **侧边栏 (Sidebar)**：
  * 展开状态宽度：`240px` (`w-60`)
  * 折叠状态宽度：`68px` (`w-[68px]`)
  * 桌面端具备丝滑的折叠动画；移动端抽屉全量覆盖。
* **顶部导航栏 (Header)**：
  * 高度统一：`56px` (`h-14`)
  * 底部单线分割：`border-b border-border`
  * 承载面包屑、搜索触发、快捷通知、主题切换与管理员头像菜单。
* **页面主容器 (Main Content)**：
  * 页面内边距：Desktop `p-6` (24px)，Mobile `p-4` (16px)
  * 页面最大宽度：`max-w-7xl` 或铺满（对于高密数据表格页面默认满宽自适应）。

---

## 4. 标准业务组件规范

### 4.1 指标卡片 (MetricCard)
* 结构：左侧标题（`text-xs font-medium text-muted-foreground`）与数值（`text-2xl font-bold tracking-tight tabular-nums`），右侧放置一个低明度半透明的浅色图标背景容器。
* 状态对比（如相比昨日）使用带色彩小徽标表示，杜绝使用大红大绿整个卡片铺底。

### 4.2 数据表格 (DataTable)
* **表头 (Header)**：高度 `40px`，浅色背景 `bg-muted/50`，文本加粗小号 `text-xs font-semibold text-muted-foreground uppercase`。
* **行间距 (Row Height)**：紧凑模式高度 `48px`，斑马纹可选，Hover 状态柔和高亮 `hover:bg-muted/40`。
* **操作列 (Actions)**：
  * 每一行右侧主要操作折叠为 `MoreHorizontal` 图标按钮，点击展开 `DropdownMenu`。
  * 严禁在每一行直接平铺 4-5 个文字按钮，彻底消除视觉杂乱。

### 4.3 状态徽标 (StatusBadge)
* 采用 `variant="outline"` 形式，搭配微弱的背景色与语义化圆点（Status Dot）：
  * 正常/开启：绿色圆点 + 浅绿背景
  * 警告/待处理：橙色圆点 + 浅橙背景
  * 异常/停用：红色圆点 + 浅红背景
  * 中性/已忽略：灰色圆点 + 浅灰背景

### 4.4 结构化 JSON 差异比对器 (JsonDiffViewer)
* 针对操作审计日志中 `before_data` 与 `after_data` 的对比：
  * 新增字段高亮浅绿背景，行首带 `+`
  * 删除字段高亮浅红背景，行首带 `-`
  * 修改字段并列对比前后差异
  * 提供“一键复制完整 JSON”与“展开原始 JSON”功能。

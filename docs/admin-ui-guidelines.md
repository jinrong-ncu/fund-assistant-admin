# 估值助手管理后台 UI 实现与规范红线 (Admin UI Guidelines)

为确保 Fund Assistant Admin V2 在后续迭代维护中始终保持高度一致、高专业度且低维护成本的视觉品质，所有代码编写者（包括人类工程师与 AI 编程智能体）在修改或新增 UI 时必须严格遵守以下规则。

---

## 1. 绝对禁止事项 (Strictly Prohibited)

1. **严禁硬编码颜色与自定义阴影**：
   * ❌ 禁止在任何业务代码中写死十六进制色值（如 `#1677ff`, `#f5222d`）或 `rgb()`。
   * ❌ 禁止使用 Tailwind 任意数值类名，如 `bg-[#1e293b]`、`shadow-[0_10px_30px_rgba(0,0,0,0.5)]`。
   * ✅ 所有颜色必须通过语义化 Token 引用（如 `bg-background`, `text-muted-foreground`, `border-border`, `text-destructive`）。
2. **严禁使用营销型 SaaS 视觉元素**：
   * ❌ 禁止大面积多彩渐变背景（如 `bg-gradient-to-r from-purple-500 to-pink-500`）。
   * ❌ 禁止毛玻璃拟态（`backdrop-blur-xl bg-white/20`）。
   * ❌ 禁止超大圆角（如 `rounded-3xl`, `rounded-full` 用于矩形卡片）。
   * ❌ 禁止在每张 Card 上施加厚重的投影；容器必须依赖 `border border-border` 划分空间。
3. **严禁页面自创表格与分页逻辑**：
   * ❌ 禁止在每个业务页面自行手写 HTML `<table>` 或拼装各自的分页控件。
   * ✅ 必须统一使用封装好的 `DataTable` 组件，保持筛选、空状态、骨架屏、URL 同步机制完全统一。
4. **严禁在表格行中平铺大量操作按钮**：
   * ❌ 禁止每一行放 4~5 个纯文字或图标按钮（如“查看 编辑 重算 删除 复制”全部横排）。
   * ✅ 最多保留 1 个高频核心操作（如“查看”），其余操作一律收敛于行末的 `DropdownMenu`（`MoreHorizontal` 图标触发）。
5. **严禁全屏打断式巨大 Loading Spin**：
   * ❌ 页面加载时禁止使用遮蔽全屏的居中大菊花转圈。
   * ✅ 必须使用与目标区域等高的 **Skeleton 骨架屏**（`TableSkeleton`, `CardSkeleton`），保持页面骨架布局稳定，杜绝布局抖动（CLS）。
6. **严禁破坏无障碍与键盘焦点**：
   * ❌ 禁止为了视觉“纯净”而全局删除 `focus:ring` 或 `outline-none`。
   * ✅ 保留 Radix UI / shadcn 默认的 Accessible Focus Ring。

---

## 2. 核心通用组件强制复用清单

业务页面组装时必须优先复用以下标准资产，杜绝重新发明轮子：

| 组件名称 | 规范用途 | 禁止自建项 |
| :--- | :--- | :--- |
| `<PageHeader />` | 页面顶部标题、描述文案、右侧主操作区域（如刷新、导出、新增按钮） | 禁止在页面内部自行写 `<h1>` + Flex 容器拼凑 |
| `<MetricCard />` | 工作台各指标项，自带标题、格式化数值、同比徽标及图标背景 | 禁止每个指标卡使用不同的卡片样式或边距 |
| `<DataTable />` | 全局统一数据表格，集成 TanStack Table，内置排序、分页、多选及列显隐 | 禁止自行组合原生 Table |
| `<DataTableToolbar />` | 表格上方检索框、状态筛选下拉选择器、重置按钮栏 | 禁止在每个页面写样式各异的搜索条 |
| `<StatusBadge />` | 状态徽标，自带圆点指引与柔和半透明色彩 | 禁止自创 Tag 样式 |
| `<DetailSheet />` | 针对用户全景画像、操作审计详情的右侧滑出抽屉 | 禁止多级页面跳转导致上下文丢失 |
| `<FormSection />` | 大型表单分组容器，提供清晰的标题与下划线分割 | 禁止在单个 Card 堆满数十个输入框 |
| `<ConfirmActionDialog />` | 危险操作二次确认（如删除标的、重算持仓） | 禁止直接执行无反馈的危险写操作 |
| `<ReasonDialog />` | 强制输入操作原因的对话框（如流水修改、删除） | 禁止省略变更原因直接提交 |
| `<CopyButton />` | 一键复制 OpenID、股票代码或 secid，自带复制成功反馈 | 禁止用户手动长按复制 |
| `<JsonDiff />` | 结构化比对修改前后的 JSON 对象，高亮标出字段变动 | 禁止使用未经格式化的单行纯文本输出 |

---

## 3. 表单设计与密度控制 (Form Density)

* **间距层次**：
  * 表单项之间间距统一为 `space-y-4` (16px)。
  * 每一个 FormItem 必须保持固定结构：
    `FormLabel` -> `FormControl` -> `FormDescription` (可选) -> `FormMessage` (错误提示)。
* **校验时机**：
  * 前端优先在 `onBlur` 或提交时触发 Zod Schema 校验，输入时清空对应字段的错误提示。
  * 提交中按钮必须展示 Spinner 图标，并自动置为 `disabled`，防范重复点击（防重放）。

---

## 4. 高危操作防误触体验 (Safety & Confirmation)

1. **危险语义配色**：
   * 任何涉及“删除”、“清空”、“重置”等不可逆破坏性操作的按钮，必须使用 `variant="destructive"`。
2. **提审模式与全局开关规范**：
   * 诸如 `review_mode`（提审模式）此类会大幅削减小程序可用功能的重大开关，严禁点击 Switch 瞬间就请求后端。
   * 必须弹出 `AlertDialog`，清晰标明：
     - 当前状态及变更目标状态
     - 影响的小程序端功能清单（如“将隐藏新增入口”、“将暂停截图识别”）
     - 确认按钮带倒计时或强制手动二次点击确认。

---

## 5. 格式化输出强制规范 (Formatters)

* **金额货币**：
  * 一律使用 `formatCurrency(val)`，保留 2 位小数，千分位逗号，且应用 `tabular-nums` 类名。
* **日期时间**：
  * 列表时间展示一律使用统一工具 `formatDateTime(val)`（输出 `YYYY-MM-DD HH:mm`）。
  * 杜绝同一个项目里有的写 `toLocaleDateString()`，有的写 `dayjs().format()`，导致格式凌乱与水合报错（Hydration Mismatch）。

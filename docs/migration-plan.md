# 估值助手管理后台 V2 数据迁移与平滑升级方案 (Migration Plan)

## 1. 迁移目标与边界原则

本次重写为 **系统架构与前端全栈彻底重构**，但底层核心业务数据承载于生产环境的 Supabase PostgreSQL 数据库。

迁移的核心底线是：
1. **零数据丢失 (Zero Data Loss)**：现有的小程序真实用户、持仓汇总、交易流水、自选清单、工单反馈历史绝对不可破坏。
2. **零破坏性变更 (Non-destructive Migration)**：严禁直接在生产数据库对现有业务字段执行 DROP COLUMN 或破坏性类型修改。
3. **平滑过渡 (Smooth Transition)**：新后台在上线初期与旧小程序 API 保持共享同一底层数据库，通过 Drizzle Schema 映射与扩展字段兼容旧结构。

---

## 2. 数据库实体分类处理策略

我们将所有数据实体划分为四类处理：**Reuse (复用)**、**Transform (转换补充)**、**Migrate (迁移新建)** 与 **Deprecate (废弃)**。

| 实体表名 | 处理策略 | 现状与演进方案 | 风险评级 |
| :--- | :--- | :--- | :--- |
| `users` | **Reuse** | 完全复用现有微信用户主表（包含 `openid`, `user_code`, `nickname`, `avatar_url`）。仅使用 Drizzle Schema 映射，不变更字段。 | 低 |
| `holdings` | **Reuse** | 完全复用现有持仓汇总表，作为小程序读取与后台重算更新的目标。 | 低 |
| `transactions` | **Reuse** | 完全复用交易流水表。V2 后台写操作严格在单个事务内连带更新 `holdings` 与 `audit_logs`。 | 低 |
| `watchlist` | **Reuse** | 完全复用用户自选关注表。 | 低 |
| `feedback` | **Reuse** | 完全复用现有反馈表，新增状态与处理备注字段若已存在则直接映射，若无则执行非空带默认值的安全 Drizzle Migration。 | 低 |
| `hot_funds` | **Reuse** | 热门基金推荐表直接复用。 | 低 |
| `changelogs` | **Transform** | 旧版本日志的 `details` 需确保为结构化 JSON 数组（`Array<{type, content}>`），若历史数据存在旧纯文本，编写自动归一化转换脚本。 | 中 |
| `resources` | **Reuse** | 社群与支持资源配置直接复用。 | 低 |
| `system_configs` | **Reuse** | 现有键值表直接复用（`show_market_indices`, `review_mode`, `ocr_enabled`, `personal_safe_mode` 等）。 | 低 |
| `market_stocks` | **Reuse** | 东方财富入库的股票标的表直接复用。 | 低 |
| `market_layouts` | **Transform** | 确保历史行情布局快照具备明确的版本号 `version` 与状态标记，支持草稿与已发布状态隔离。 | 中 |
| `audit_logs` | **Transform** | 规范审计表的 `action`, `target_type`, `before_data`, `after_data`, `reason` 字段，确保 V2 写入格式统一。 | 低 |
| `admin_users` | **Migrate** | **全新建立**：若生产数据库此前无独立管理员表（仅靠环境变量单一密码），则新建 `admin_users` 表，并使用 Seed 脚本初始化超级管理员账号。 | 中 |

---

## 3. Drizzle Kit 迁移执行步骤

1. **Schema 代码内聚**：
   * 在 `src/db/schema/` 中编写完整的 TypeScript Schema 定义。
2. **生成差量迁移 SQL**：
   * 运行 `pnpm drizzle-kit generate` 生成清晰审查的 `.sql` 脚本文件，纳入 Git 版本追踪。
   * 检查生成的 SQL，确认无意中未产生任何 `DROP TABLE` 或 `DROP COLUMN` 语句。
3. **测试环境验证**：
   * 在本地或 Staging 环境运行 `pnpm drizzle-kit migrate`，验证 Schema 对齐与约束生效。
4. **初始管理员种子注入 (Seed Script)**：
   * 编写 `src/db/seed.ts`，自动检测若 `admin_users` 为空，则从环境变量 `ADMIN_INITIAL_EMAIL` 与 `ADMIN_INITIAL_PASSWORD` 创建初始管理员账号（`role: 'admin'`），密码使用安全哈希。

---

## 4. 线上切换与回滚保障 (Rollback Strategy)

### 4.1 双端共存灰度期
* 新版 V2 管理后台（Next.js）部署在独立域名或子路径（如 `admin-v2.liujinrong.cn`）。
* 旧版 V1 管理后台保持可用备用。
* 由于底层共享同一 PostgreSQL 数据库且 API 业务语义完全对齐，管理员可在两套后台之间随时交叉验证数据一致性。

### 4.2 回滚预案
* 若新后台在运行期间发现未知缺陷：
  1. 直接停止 V2 域名解析或停用容器服务；
  2. 切换回旧版 Vite + AntD 管理后台；
  3. 因为未修改任何旧业务核心字段，旧系统可无缝继续读取并处理业务。

# 估值助手后台

独立 Web Admin，用于管理估值助手小程序的用户、反馈、热门基金、更新日志、系统配置和审计记录。

## 本地运行

```bash
pnpm install
pnpm dev
```

默认后端：

```text
https://api.liujinrong.cn
```

如需覆盖：

```bash
cp .env.example .env.local
```

```text
VITE_API_BASE_URL=https://api.liujinrong.cn
```

## 登录

当前 bootstrap 管理员由后端环境变量提供：

```text
ADMIN_BOOTSTRAP_EMAIL
ADMIN_BOOTSTRAP_PASSWORD
```

登录后前端会把 Admin JWT 保存在 `localStorage`，后续请求使用：

```http
Authorization: Bearer <token>
```

## 已实现模块

- 登录 / 退出
- 概览 Dashboard
- 用户搜索与用户详情
- 反馈处理
- 热门基金新增与启停
- 更新日志查看
- 系统配置切换
- 操作审计查看

## 部署

推荐部署到 Vercel，域名可绑定：

```text
admin.liujinrong.cn
```

Vercel 环境变量：

```text
VITE_API_BASE_URL=https://api.liujinrong.cn
```


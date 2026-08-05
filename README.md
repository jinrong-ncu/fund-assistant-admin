# 估值助手管理后台

面向单人维护的独立 Web 管理端，用于查看用户数据、处理反馈以及调整小程序内容和系统配置。

## 本地运行

先在 `fund-assistant` 仓库启动后端：

```bash
vercel dev --listen 3000
```

再启动管理端：

```bash
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:5174`。开发环境会自动把 `/api` 请求代理到 `http://localhost:3000`。

## 环境变量

生产部署时配置：

```text
VITE_API_BASE_URL=https://api.liujinrong.cn
```

管理员账号、密码和 JWT 密钥只配置在后端，不应放入本仓库。

## 功能

- 工作台与服务健康状态
- 用户查询、金额记录、关注清单和流水管理
- 反馈状态、优先级与处理备注
- 热门内容、版本日志、交流与支持资源
- 小程序功能开关和图片地址配置
- 后台操作记录

## 验证

```bash
pnpm build
```

生产站点使用 Hash 路由，不需要额外配置页面重写规则。

# Discord OAuth 配置指南

## 概述

BB Market 的 Discord 登录功能已实现代码部分，但需要在以下平台进行配置：
1. Discord Developer Portal - 创建应用并获取 Client ID 和 Secret
2. Supabase Dashboard - 启用 Discord OAuth Provider

## 步骤 1: Discord Developer Portal 配置

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 "New Application" 创建一个新应用
3. 点击 "OAuth2" 左侧菜单
4. 在 "Redirects" 部分，点击 "Add Redirect"
5. 添加以下 Redirect URI：
   - 生产环境：`https://ytsqawvrgzxgfluuadao.supabase.co/auth/v1/callback`
   - 开发环境：`http://localhost:3000/auth/v1/callback`
   - 同时添加：`http://localhost:3000/login/success`（用于测试）
6. 在 "Scopes" 部分，确保勾选 `identify` 和 `email`
7. 点击 "Save Changes"
8. 复制 "CLIENT ID" 和 "CLIENT SECRET"

## 步骤 2: Supabase Dashboard 配置

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目 (ytsqawvrgzxgfluuadao)
3. 左侧菜单点击 "Authentication"
4. 点击 "Providers"
5. 找到 "Discord" 并点击
6. 启用 Discord：
   - 将 "Enable Discord" 开关打开
   - Client ID: 填入 Discord 的 Client ID
   - Client Secret: 填入 Discord 的 Client Secret
   - Redirect URLs: 添加
     - `http://localhost:3000/login/success`
     - `https://ytsqawvrgzxgfluuadao.supabase.co/auth/v1/callback`
7. 点击 "Save"

## 步骤 3: 更新环境变量

在 `.env.local` 文件中更新 Discord 相关配置：

```env
# Discord OAuth（填入你在 Discord Developer Portal 获取的值）
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
```

注意：Supabase 会自动从 Dashboard 配置中读取 Discord 的 Client ID 和 Secret，不需要在前端环境变量中配置。

## 步骤 4: 重启开发服务器

```bash
cd ~/.openclaw/workspace/bb-market-next
npm run dev
```

## 测试

1. 打开浏览器访问 http://localhost:3000/login
2. 点击 "Discord 登录" 按钮
3. 应该会跳转到 Discord 授权页面
4. 完成授权后，会自动跳回并登录成功

## 已创建的文件

- `src/app/api/auth/discord/authorize/route.ts` - Discord 授权 API
- `src/app/api/auth/discord/callback/route.ts` - Discord OAuth 回调处理
- `src/app/login/success/page.tsx` - 登录成功页面
- `src/app/login/page.tsx` - 添加了 Discord 登录按钮

## 注意事项

- Discord 登录的用户会在 Supabase Auth 中自动创建
- 用户的 email 来自 Discord（需要 Discord 账户绑定了邮箱）
- 如果 Discord 账户没有绑定邮箱，登录会失败

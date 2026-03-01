# BB Market 数据库设置

## 概述

本项目使用 Prisma + PostgreSQL 作为数据库。

## 快速开始

### 方式一：使用 Supabase（推荐）

1. 访问 [supabase.com](https://supabase.com) 创建免费账户
2. 创建新项目，获取 `DATABASE_URL`
3. 更新 `.env` 文件：
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   ```

4. 运行数据库迁移：
   ```bash
   npm run db:push
   ```

5. 填充初始数据：
   ```bash
   npm run db:seed
   ```

### 方式二：使用本地 PostgreSQL

1. 安装 PostgreSQL：
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

2. 创建数据库：
   ```bash
   createdb bbmarket
   ```

3. 更新 `.env`：
   ```
   DATABASE_URL="postgresql://localhost:5432/bbmarket"
   ```

4. 运行：
   ```bash
   npm run db:push
   npm run db:seed
   ```

## 数据库命令

| 命令 | 说明 |
|------|------|
| `npm run db:push` | 同步 schema 到数据库 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:seed` | 填充初始数据 |
| `npm run db:studio` | 打开 Prisma Studio (数据库管理界面) |

## 数据模型

- **User** - 用户
- **Game** - 游戏
- **Server** - 服务器
- **Listing** - 商品
- **Order** - 订单
- **Wallet** - 钱包
- **Favorite** - 收藏
- **Setting** - 系统设置

## 环境变量

```
DATABASE_URL=postgresql://...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
JWT_SECRET=...
```

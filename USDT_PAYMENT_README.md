# USDT 支付功能

## 功能概述

BB Market 现在支持 USDT (TRC20) 充值支付功能。

## 功能列表

### 1. 充值页面 `/recharge`
- 输入充值金额
- 显示 USDT 收款地址 (TRC20)
- 二维码显示
- 15分钟有效期倒计时
- 提醒仅支持 TRC20 网络

### 2. 支付选择
- 在结算页面添加 USDT 直接支付选项
- 用户可以选择余额支付或 USDT 直接支付

### 3. 充值记录
- 在钱包页面显示充值记录
- 状态: pending(等待转账) / pending_confirm(等待确认) / completed(已完成) / expired(已过期) / rejected(已拒绝)

### 4. 人工确认机制
- 管理员后台: `/dashboard/admin/recharge`
- 管理员确认用户充值到账
- 确认后自动更新用户余额

## 环境变量

在 `.env` 中添加以下配置:

```
# USDT TRC20 Payment
NEXT_PUBLIC_USDT_TRC20_ADDRESS="你的TRC20地址"
NEXT_PUBLIC_USDT_EXPIRY_MINUTES=15
NEXT_PUBLIC_USDT_MIN_AMOUNT=5
ADMIN_SECRET_KEY="管理密钥"
```

## 数据库初始化

需要创建 `recharge` 表。在 Supabase SQL Editor 中运行:

```sql
-- 创建 recharge 表
CREATE TABLE IF NOT EXISTS recharge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_user_id ON recharge(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON recharge(status);

-- 启用 RLS
ALTER TABLE recharge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recharge" ON recharge FOR ALL USING (true) WITH CHECK (true);

-- 创建 transaction 表 (如果没有)
CREATE TABLE IF NOT EXISTS transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON transaction(user_id);

ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to transaction" ON transaction FOR ALL USING (true) WITH CHECK (true);
```

## 支付流程

1. 用户在结算页面选择 "USDT 直接支付"
2. 跳转到充值页面 `/recharge`
3. 输入充值金额，点击生成支付信息
4. 显示收款地址和二维码
5. 用户转账 USDT 到指定地址
6. 点击 "我已转账，等待确认"
7. 管理员在后台确认充值
8. 用户余额自动更新

## 文件结构

```
src/
├── app/
│   ├── recharge/
│   │   └── page.tsx          # 充值页面
│   ├── api/
│   │   ├── recharge/
│   │   │   ├── create/       # 创建充值记录
│   │   │   ├── confirm/      # 用户确认转账
│   │   │   ├── list/         # 获取充值列表
│   │   │   └── init/         # 初始化检查
│   │   └── admin/
│   │       └── recharge/    # 管理员确认
│   └── dashboard/
│       ├── admin/
│       │   └── recharge/     # 管理员页面
│       └── wallet/          # 钱包页面(已更新)
├── cart/
│   └── checkout/            # 结算页面(已更新)
└── .env                     # 环境变量(已更新)
```

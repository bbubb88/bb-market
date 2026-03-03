# Cryptomus 支付对接配置指南

## 简介

Cryptomus 是一个加密货币支付网关，支持 USDT (TRC20/ERC20) 等多种加密货币。特点：
- ✅ 无需 KYC
- ✅ 支持 USDT (TRC20/ERC20)
- ✅ 手续费约 0.5%
- ✅ 有支付 API 和 IPN 回调
- ✅ 支持静态钱包（用户直接转账到地址）

## 注册和获取 API Key

1. 访问 https://app.cryptomus.com/signup 注册账号
2. 登录后进入 Dashboard
3. 进入 Settings → API Keys 创建 API Key
   - Payment Key: 用于创建支付
   - Payout Key: 用于提现（可选）
4. 获取 Merchant ID

## 环境变量配置

在 `.env.local` 文件中添加以下变量：

```bash
# Cryptomus API 配置
# 1. 访问 https://app.cryptomus.com 注册账号
# 2. 在 Dashboard → Settings → API Keys 获取
CRYPTOMUS_MERCHANT_ID="your_merchant_id"
CRYPTOMUS_PAYMENT_KEY="your_payment_key"
CRYPTOMUS_PAYOUT_KEY="your_payout_key"  # 可选
```

## 数据库迁移

如果需要额外存储 Cryptomus 相关字段，可以运行以下 SQL（可选，现有结构已支持）：

```sql
-- 在 Supabase SQL Editor 中执行
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS cryptomusUuid VARCHAR(255);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS cryptomusCurrency VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS cryptomusNetwork VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS cryptomusStatus VARCHAR(50);
```

## Cryptomus Dashboard 配置

1. 登录 https://app.cryptomus.com
2. 进入 Merchant Settings 确保启用 USDT 支付
3. 可以设置 IPN 回调 URL（可选，代码已自动处理）：
   - URL: `https://bb-market-next.vercel.app/api/recharge/cryptomus/ipn`

## 支付流程

1. 用户在充值页面选择金额
2. 系统优先调用 Cryptomus API 创建静态钱包
3. 用户向显示的地址转账 USDT
4. Cryptomus 通过 IPN 回调通知支付状态
5. 系统自动确认并更新用户余额

## 文件结构

```
src/
├── lib/
│   └── cryptomus.ts           # Cryptomus API 客户端
├── app/
│   ├── recharge/
│   │   └── page.tsx           # 充值页面（已更新支持 Cryptomus）
│   └── api/
│       └── recharge/
│           └── cryptomus/
│               ├── create/    # 创建支付
│               ├── ipn/       # Webhook 回调
│               └── status/    # 状态查询
└── .env.local                 # 环境变量（已更新）
```

## 测试

1. 配置好 Cryptomus API Key 后部署
2. 登录网站，进入充值页面
3. 输入充值金额并创建支付
4. 系统会使用 Cryptomus 生成支付地址
5. 用户转账后，Cryptomus 会通过 IPN 回调通知支付状态

## 费用

Cryptomus 收取约 0.5% 的手续费。

## 备用方案

如果 Cryptomus 不可用，系统会自动回退到：
1. NowPayments
2. 手动转账（传统方式）

## 注意事项

1. 确保 Merchant ID 和 Payment Key 正确配置
2. 生产环境建议启用 Webhook 签名验证
3. 静态钱包模式：用户直接转账到地址，类似传统方式但有自动确认
4. 如果需要更灵活的支付页面链接模式，可以额外实现 `createPayment` 方法

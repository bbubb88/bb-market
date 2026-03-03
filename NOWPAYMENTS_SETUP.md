# NowPayments 对接配置指南

## 环境变量配置

在 `.env.local` 文件中添加以下变量：

```bash
# NowPayments API 配置
# 1. 访问 https://nowpayments.io 注册账号
# 2. 在 Dashboard 获取 API Key
NOWPAYMENTS_API_KEY="your_nowpayments_api_key_here"

# IPN 回调签名密钥（用于验证回调请求）
# 可以自己生成一个随机字符串
NOWPAYMENTS_IPN_SECRET="your_ipn_secret_here"

# 可选：指定收款地址（如果不设置，NowPayments 会使用你的默认钱包）
# NOWPAYMENTS_PAYOUT_ADDRESS="your_usdt_trc20_address"
```

## 数据库迁移

运行以下 SQL 添加 NowPayments 相关字段：

```bash
# 在 Supabase SQL Editor 中执行
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS nowpaymentsId VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS nowpaymentsStatus VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS payAmount VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS payCurrency VARCHAR(50);
```

## NowPayments Dashboard 配置

1. 登录 https://nowpayments.io
2. 进入 Dashboard → API Keys 创建 API Key
3. 进入 Dashboard → IPN Settings 设置回调 URL：
   - URL: `https://bb-market-next.vercel.app/api/recharge/nowpayments/ipn`
4. 确保启用 USDT (TRC20) 作为支付货币

## 测试

1. 配置好环境变量后部署
2. 登录网站，进入充值页面
3. 输入充值金额并创建支付
4. 系统会使用 NowPayments 生成支付地址
5. 用户转账后，NowPayments 会通过 IPN 回调通知支付状态

## 费用

NowPayments 收取约 0.5%-2.5% 的手续费（取决于交易量）。

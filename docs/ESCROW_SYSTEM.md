# BB Market 资金托管系统 - 设计文档

## 概述

BB Market 采用第三方平台资金托管模式，确保买卖双方交易安全。

## 资金流向

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          资金流向图                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   充值流程:                                                              │
│   ┌──────────┐    ┌──────────────┐    ┌─────────────┐                  │
│   │  买家    │───▶│ 第三方平台   │───▶│ 买家冻结余额 │                  │
│   │ 付款    │    │ (TRC20收款)  │    │ (Frozen)    │                  │
│   └──────────┘    └──────────────┘    └─────────────┘                  │
│                                                                         │
│   交易流程:                                                              │
│   ┌─────────────┐    ┌──────────┐    ┌────────────┐                   │
│   │ 买家冻结余额 │───▶│ 订单锁定  │───▶│ 卖家余额   │                   │
│   │ (Frozen)    │    │ (Locked) │    │ (Balance)  │                   │
│   └─────────────┘    └──────────┘    └────────────┘                   │
│                                                                         │
│   提现流程:                                                              │
│   ┌──────────┐    ┌─────────────┐    ┌──────────┐                     │
│   │ 买家余额  │───▶│ 平台扣款    │───▶│ 买家钱包  │                     │
│   │          │    │ (扣5%手续费) │    │ (TRC20)  │                     │
│   └──────────┘    └─────────────┘    └──────────┘                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 数据库表结构

### 1. Wallet (钱包表)
```sql
-- 扩展字段
balance   -- 可用余额 (可提现)
frozen    -- 冻结余额 (托管中)
locked    -- 锁定余额 (订单锁定中)
```

### 2. EscrowLock (托管锁定表)
```sql
id          UUID PRIMARY KEY
orderId     VARCHAR(100)    -- 订单ID
buyerId     VARCHAR(100)    -- 买家ID
amount      DECIMAL(20,8)   -- 锁定金额
fee         DECIMAL(20,8)   -- 手续费
totalAmount DECIMAL(20,8)   -- 总金额
status      VARCHAR(50)     -- LOCKED/RELEASED/REFUNDED
createdAt   TIMESTAMP
releasedAt  TIMESTAMP
```

### 3. EscrowTransaction (交易记录表)
```sql
id          UUID PRIMARY KEY
userId      VARCHAR(100)
orderId     VARCHAR(100)
type        VARCHAR(50)     -- DEPOSIT/LOCK/RELEASE/REFUND/WITHDRAWAL/FEE
amount      DECIMAL(20,8)
fee         DECIMAL(20,8)
status      VARCHAR(50)
description TEXT
txHash      VARCHAR(200)
createdAt   TIMESTAMP
```

### 4. Withdrawal (提现申请表) ⚡ 新增
```sql
id            UUID PRIMARY KEY
userId        VARCHAR(100)
amount        DECIMAL(20,8)   -- 提现金额
fee           DECIMAL(20,8)   -- 手续费 (5%)
netAmount     DECIMAL(20,8)   -- 实际到账
address       VARCHAR(200)    -- 提现地址 (TRC20)
addressType   VARCHAR(20)     -- TRC20
status        VARCHAR(50)     -- PENDING/PROCESSING/COMPLETED/FAILED
txHash        VARCHAR(200)    -- 区块链交易哈希
errorMessage  TEXT
createdAt     TIMESTAMP
processedAt   TIMESTAMP
completedAt   TIMESTAMP
```

### 5. DepositAddress (充值地址表) ⚡ 新增
```sql
id          UUID PRIMARY KEY
userId      VARCHAR(100)
address     VARCHAR(200)
addressType VARCHAR(20) DEFAULT 'TRC20'
isActive    BOOLEAN
createdAt   TIMESTAMP
lastUsedAt  TIMESTAMP
```

## API 接口

### 1. 充值 (Deposit)
```
POST /api/escrow/v2
{
  action: 'deposit',
  userId: 'xxx',
  amount: 100,
  txHash: 'xxx'  // 区块链交易哈希
}

响应:
{
  success: true,
  frozen: 100,
  message: '成功充值 100 USDT 到托管账户'
}
```

### 2. 锁定 (Lock)
```
POST /api/escrow/v2
{
  action: 'lock',
  userId: 'xxx',
  amount: 100,
  orderId: 'order_123'
}
```

### 3. 放行 (Release)
```
POST /api/escrow/v2
{
  action: 'release',
  orderId: 'order_123',
  sellerId: 'seller_xxx'
}
```

### 4. 退款 (Refund)
```
POST /api/escrow/v2
{
  action: 'refund',
  orderId: 'order_123'
}

特点: 全额退款，平台不扣钱
```

### 5. 提现 (Withdraw) ⚡
```
POST /api/withdraw
{
  userId: 'xxx',
  amount: 100,
  address: 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh',
  addressType: 'TRC20'
}

响应:
{
  success: true,
  withdrawalId: 'xxx',
  amount: 100,
  fee: 5,           // 5% 手续费
  netAmount: 95,    // 实际到账
  message: '提现申请已提交\n\n提现金额: 100 USDT\n手续费 (5%): 5 USDT\n实际到账: 95 USDT'
}
```

### 6. 查询余额
```
GET /api/escrow/v2?userId=xxx

响应:
{
  balance: 100,
  frozen: 50,
  locked: 0,
  config: {
    withdrawalFeePercent: 5,
    platformWallet: 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh'
  }
}
```

## 手续费规则

### 提现手续费
- **费率**: 5%
- **计算公式**: `实际到账 = 提现金额 - (提现金额 × 5%)`
- **示例**:
  - 提现 100 USDT → 手续费 5 USDT → 到账 95 USDT
  - 提现 50 USDT → 手续费 2.5 USDT → 到账 47.5 USDT

### 交易手续费 (可选)
- 当前版本: 免费
- 未来可能: 1-2%

### 退款
- **全额退款**: 平台不收取任何费用

## 平台配置

```typescript
const PLATFORM_CONFIG = {
  // 平台收款地址 (TRC20)
  wallet: 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh',
  
  // 提现手续费 (%)
  withdrawalFeePercent: 5,
  
  // 支持的地址类型
  supportedAddressTypes: ['TRC20'],
  
  // 提现处理时间
  withdrawalProcessTime: '1-3 工作日',
};
```

## 部署步骤

1. **运行数据库迁移**:
```bash
psql -h database.url -U postgres -d bb_market -f migrations/escrow_system_v2.sql
```

2. **更新环境变量**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

3. **重启服务**:
```bash
npm run dev
```

## 注意事项

1. **TRC20 地址验证**: 提现地址必须以 T 开头，长度 34 位
2. **余额检查**: 冻结余额和锁定余额不能直接提现
3. **异步处理**: 实际转账应为异步任务，生产环境需对接 TRC20 节点
4. **安全**: 实际生产中需要增加 IP 限流、验证码等安全措施

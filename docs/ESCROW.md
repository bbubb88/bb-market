# BB Market USDT 资金托管系统 v2

## 核心变化（对比 v1）

| 特性 | v1 (旧) | v2 (新) |
|------|---------|---------|
| 资金存放 | 平台账户 | 第三方托管 |
| 交易完成 | 资金给卖家 | 资金转入卖家账户 |
| 退款 | 退平台账户 | 原路退回给买家 |
| 提现 | 无 | 收取 5% 手续费 |

## 资金流向图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           买家流程                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. 充值                                                                  │
│     买家转账 USDT 到平台地址 → 管理员确认                                  │
│     ↓                                                                    │
│     资金进入【托管余额】(escrowBalance) ← 不在平台账户！                  │
│                                                                          │
│  2. 支付订单                                                              │
│     使用托管余额支付 → 资金锁定到订单                                      │
│     ↓                                                                    │
│     escrowBalance ↓  locked ↑                                            │
│                                                                          │
│  3. 确认收货                                                              │
│     锁定资金释放给卖家 → 进入卖家账户                                       │
│     ↓                                                                    │
│     locked ↓  seller.balance ↑                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           卖家流程                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. 收入                                                                  │
│     买家确认收货 → 资金自动转入卖家钱包 (balance)                          │
│                                                                          │
│  2. 提现                                                                  │
│     申请提现 → 平台扣除 5% 手续费 → 第三方平台打款                        │
│     ↓                                                                    │
│     balance ↓  手续费 (5%) → actualAmount 到账                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           退款流程                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  订单锁定中 → 买家取消/卖家未发货                                         │
│     ↓                                                                    │
│     资金原路返回 → 回到买家托管余额 escrowBalance                         │
│     (不退平台，直接退给买家)                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 钱包字段说明

| 字段 | 说明 | 用途 |
|------|------|------|
| **balance** | 可用余额 | 卖家收入，可提现 |
| **escrowBalance** | 托管余额 | 买家资金，用于支付订单 |
| **locked** | 锁定金额 | 已锁定到订单，等待确认/退款 |

## API 接口

### 1. 资金托管主 API

**端点**: `POST /api/escrow`

```json
// 充值到托管
{
  "action": "deposit",
  "userId": "user_xxx",
  "amount": 100
}

// 管理员确认充值（资金进入托管）
{
  "action": "confirm_deposit",
  "depositId": "deposit_xxx",
  "action": "approve"
}

// 锁定资金（支付订单时）
{
  "action": "create_escrow",
  "userId": "user_xxx",
  "amount": 50,
  "orderId": "order_xxx"
}

// 释放资金（确认收货）
{
  "action": "release",
  "orderId": "order_xxx",
  "sellerId": "seller_xxx"
}

// 退款（取消订单）
{
  "action": "refund",
  "orderId": "order_xxx"
}

// 提现（收取 5% 手续费）
{
  "action": "withdraw",
  "userId": "user_xxx",
  "amount": 100,
  "withdrawAddress": "Txxxx..."
}
```

### 2. 钱包 API

**端点**: `GET /api/wallet?userId=xxx`

```json
{
  "balance": 50,           // 可用余额（可提现）
  "escrowBalance": 100,      // 托管余额（用于支付）
  "locked": 0,               // 锁定金额
  "transactions": [...]
}
```

**端点**: `POST /api/wallet`

```json
{
  "userId": "user_xxx",
  "amount": 100,
  "address": "Txxxx..."  // TRC20 地址
}
```

响应：
```json
{
  "success": true,
  "withdrawalId": "xxx",
  "amount": 100,
  "fee": 5,           // 5% 手续费
  "actualAmount": 95, // 实际到账
  "status": "PENDING"
}
```

### 3. 订单支付 API

**端点**: `POST /api/orders/pay`

```json
{
  "orderIds": ["order_xxx"],
  "userId": "user_xxx",
  "totalAmount": 50,
  "useEscrow": true  // 必须使用托管余额
}
```

### 4. 订单状态更新 API

**端点**: `POST /api/order/update`

```json
{
  "orderId": "order_xxx",
  "status": "COMPLETED",  // 或 "CANCELLED"
  "userId": "user_xxx",
  "releaseEscrow": true   // 自动处理托管资金
}
```

## 数据库表

### EscrowDeposit - 托管充值表
```sql
CREATE TABLE EscrowDeposit (
  id UUID PRIMARY KEY,
  userId VARCHAR(100),
  amount DECIMAL(20,2),
  status VARCHAR(50),  -- PENDING, CONFIRMED, FAILED
  txHash VARCHAR(200),
  createdAt TIMESTAMP,
  confirmedAt TIMESTAMP
);
```

### EscrowLock - 托管锁定表
```sql
CREATE TABLE EscrowLock (
  id UUID PRIMARY KEY,
  orderId VARCHAR(100),
  buyerId VARCHAR(100),
  amount DECIMAL(20,2),
  fee DECIMAL(20,2),
  totalAmount DECIMAL(20,2),
  status VARCHAR(50),  -- LOCKED, RELEASED, REFUNDED
  createdAt TIMESTAMP,
  releasedAt TIMESTAMP
);
```

### Withdrawal - 提现表
```sql
CREATE TABLE Withdrawal (
  id UUID PRIMARY KEY,
  userId VARCHAR(100),
  amount DECIMAL(20,2),
  fee DECIMAL(20,2),        -- 手续费 5%
  actualAmount DECIMAL(20,2), -- 实际到账
  address VARCHAR(200),      -- TRC20 地址
  status VARCHAR(50),        -- PENDING, PROCESSING, COMPLETED, FAILED
  txHash VARCHAR(200),
  createdAt TIMESTAMP,
  completedAt TIMESTAMP
);
```

### Wallet 扩展
```sql
ALTER TABLE Wallet ADD COLUMN escrowBalance DECIMAL(20,2) DEFAULT 0;
```

## 交易流程示例

### 场景：正常购买流程

**Step 1: 买家充值**
1. 买家向 `TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh` 转账 100 USDT
2. 提交充值记录
3. 管理员确认
4. `escrowBalance = 100`

**Step 2: 买家下单支付**
1. 订单金额 50 USDT + 手续费 1.5 USDT = 51.5 USDT
2. 调用支付 API
3. `escrowBalance = 48.5`, `locked = 51.5`

**Step 3: 卖家发货**
1. 卖家发货给买家

**Step 4: 买家确认收货**
1. 确认收货
2. `locked = 0`, `seller.balance = 50`
3. 平台收取手续费 1.5 USDT

### 场景：取消订单退款

**Step 1: 订单已支付（锁定中）**
- `locked = 51.5`

**Step 2: 买家取消**
1. 取消订单
2. `locked = 0`, `escrowBalance += 51.5`（原路返回）
3. 资金回到买家托管余额

### 场景：卖家提现

**Step 1: 卖家有收入**
- `balance = 100`

**Step 2: 申请提现**
1. 申请提现 100 USDT 到地址 `Txxxxx`
2. 手续费 5% = 5 USDT
3. 实际到账 95 USDT
4. `balance = 0`, `locked = 100`

**Step 3: 管理员处理**
1. 确认打款
2. `locked = 0`
3. 记录区块链交易哈希

## 费用说明

| 类型 | 费率 | 说明 |
|------|------|------|
| 交易手续费 | 3% | 买家支付 |
| 提现手续费 | 5% | 卖家提现时扣除 |
| 充值 | 免费 | 第三方托管 |

## 待执行 SQL

在 Supabase SQL Editor 中执行：
```bash
migrations/escrow_v2.sql
```

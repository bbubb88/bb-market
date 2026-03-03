-- BB Market USDT 资金托管系统 v2
-- 核心变化: 资金由第三方托管，交易成功后才转入卖家账户

-- 1. 托管充值表 - 记录买家的充值（资金在第三方托管）
CREATE TABLE IF NOT EXISTS EscrowDeposit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(100) NOT NULL,
  amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, FAILED
  txHash VARCHAR(200), -- 区块链交易哈希
  orderId VARCHAR(100), -- 关联订单ID
  description TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmedAt TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_escrowdeposit_userid ON EscrowDeposit(userId);
CREATE INDEX IF NOT EXISTS idx_escrowdeposit_status ON EscrowDeposit(status);

-- 2. 托管锁定表 - 记录订单资金的锁定状态
CREATE TABLE IF NOT EXISTS EscrowLock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderId VARCHAR(100) NOT NULL,
  buyerId VARCHAR(100) NOT NULL,
  amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  fee DECIMAL(20,2) NOT NULL DEFAULT 0,
  totalAmount DECIMAL(20,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'LOCKED', -- LOCKED, RELEASED, REFUNDED
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  releasedAt TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_escrowlock_orderid ON EscrowLock(orderId);
CREATE INDEX IF NOT EXISTS idx_escrowlock_buyerid ON EscrowLock(buyerId);
CREATE INDEX IF NOT EXISTS idx_escrowlock_status ON EscrowLock(status);

-- 3. 托管交易记录表
CREATE TABLE IF NOT EXISTS EscrowTransaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(100),
  orderId VARCHAR(100),
  type VARCHAR(50) NOT NULL, -- DEPOSIT, LOCK, RELEASE, REFUND, WITHDRAW, FEE
  amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  fee DECIMAL(20,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
  description TEXT,
  txHash VARCHAR(200),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrowtransaction_userid ON EscrowTransaction(userId);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_orderid ON EscrowTransaction(orderId);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_type ON EscrowTransaction(type);

-- 4. 提现申请表
CREATE TABLE IF NOT EXISTS Withdrawal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(100) NOT NULL,
  amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  fee DECIMAL(20,2) NOT NULL DEFAULT 0,
  actualAmount DECIMAL(20,2) NOT NULL DEFAULT 0,
  address VARCHAR(200) NOT NULL, -- 收款人 TRC20 地址
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  txHash VARCHAR(200), -- 区块链交易哈希
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completedAt TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_userid ON Withdrawal(userId);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON Withdrawal(status);

-- 5. 更新 Wallet 表
-- 添加 escrowBalance 字段（托管余额，不在平台账户中）
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS escrowBalance DECIMAL(20,2) DEFAULT 0;
COMMENT ON COLUMN "Wallet".escrowBalance IS '托管余额（资金在第三方托管，可用于支付）';

-- 确保 locked 字段存在
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS locked DECIMAL(20,2) DEFAULT 0;

-- 6. 更新 Order 表添加托管状态
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS escrowStatus VARCHAR(50) DEFAULT 'NONE';
COMMENT ON COLUMN "Order".escrowStatus IS '托管状态: NONE, LOCKED, RELEASED, REFUNDED';

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS escrowLockedAt TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS escrowReleasedAt TIMESTAMP WITH TIME ZONE;

-- BB Market USDT 资金托管系统数据库表
-- 创建时间: 2024

-- 1. 扩展 Wallet 表 (如果不存在 locked 字段)
-- 注意: 假设 Wallet 表已有 balance 和 frozen 字段
-- ALTER TABLE Wallet ADD COLUMN IF NOT EXISTS locked DECIMAL(20,2) DEFAULT 0;

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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_escrowlock_orderid ON EscrowLock(orderId);
CREATE INDEX IF NOT EXISTS idx_escrowlock_buyerid ON EscrowLock(buyerId);
CREATE INDEX IF NOT EXISTS idx_escrowlock_status ON EscrowLock(status);

-- 3. 托管交易记录表
CREATE TABLE IF NOT EXISTS EscrowTransaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(100),
  orderId VARCHAR(100),
  type VARCHAR(50) NOT NULL, -- DEPOSIT, LOCK, RELEASE, REFUND, FEE
  amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  fee DECIMAL(20,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
  description TEXT,
  txHash VARCHAR(200), -- 区块链交易哈希
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_userid ON EscrowTransaction(userId);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_orderid ON EscrowTransaction(orderId);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_type ON EscrowTransaction(type);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_createdat ON EscrowTransaction(createdAt DESC);

-- 4. 更新 Order 表添加托管相关字段 (可选)
-- ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS escrowStatus VARCHAR(50) DEFAULT 'NONE'; -- NONE, LOCKED, RELEASED, REFUNDED
-- ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS escrowLockedAt TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS escrowReleasedAt TIMESTAMP WITH TIME ZONE;

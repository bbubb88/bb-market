-- BB Market 完整资金托管系统数据库表
-- 包含: 充值 → 冻结 → 交易 → 放行 → 提现 完整流程
-- 提现手续费: 5%

-- 1. 扩展 Wallet 表 (如果不存在 locked 字段)
-- 注意: 确保 Wallet 表有 balance, frozen, locked 字段
-- ALTER TABLE Wallet ADD COLUMN IF NOT EXISTS locked DECIMAL(20,8) DEFAULT 0;

-- 2. 托管锁定表 - 记录订单资金的锁定状态
CREATE TABLE IF NOT EXISTS EscrowLock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderId VARCHAR(100) NOT NULL,
  buyerId VARCHAR(100) NOT NULL,
  amount DECIMAL(20,8) NOT NULL DEFAULT 0,
  fee DECIMAL(20,8) NOT NULL DEFAULT 0,
  totalAmount DECIMAL(20,8) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'LOCKED',
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
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(20,8) NOT NULL DEFAULT 0,
  fee DECIMAL(20,8) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  description TEXT,
  txHash VARCHAR(200),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrowtransaction_userid ON EscrowTransaction(userId);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_orderid ON EscrowTransaction(orderId);
CREATE INDEX IF NOT EXISTS idx_escrowtransaction_type ON EscrowTransaction(type);

-- =============================================
-- 提现相关表
-- =============================================

-- 4. 提现申请表
CREATE TABLE IF NOT EXISTS Withdrawal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(100) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) NOT NULL DEFAULT 0,
  netAmount DECIMAL(20,8) NOT NULL,
  address VARCHAR(200) NOT NULL,
  addressType VARCHAR(20) NOT NULL DEFAULT 'TRC20',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  txHash VARCHAR(200),
  errorMessage TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processedAt TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_userid ON Withdrawal(userId);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON Withdrawal(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_createdat ON Withdrawal(createdAt DESC);

-- 5. 充值地址表 - 用户充值地址管理
CREATE TABLE IF NOT EXISTS DepositAddress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL,
  addressType VARCHAR(20) NOT NULL DEFAULT 'TRC20',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lastUsedAt TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_depositaddress_userid ON DepositAddress(userId);
CREATE INDEX IF NOT EXISTS idx_depositaddress_address ON DepositAddress(address);

-- =============================================
-- RLS 策略 (可选)
-- =============================================

-- 为所有新表启用 RLS (如果需要)
-- ALTER TABLE "EscrowLock" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "EscrowTransaction" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Withdrawal" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "DepositAddress" ENABLE ROW LEVEL SECURITY;

-- 创建策略 (允许所有操作 - 开发环境)
-- DROP POLICY IF EXISTS "Allow all on EscrowLock" ON "EscrowLock";
-- CREATE POLICY "Allow all on EscrowLock" ON "EscrowLock" FOR ALL USING (true) WITH CHECK (true);

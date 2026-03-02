-- 在 Supabase SQL Editor 中运行以下 SQL 来创建充值记录表

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
CREATE INDEX IF NOT EXISTS idx_recharge_created_at ON recharge(created_at DESC);

-- 启用 RLS
ALTER TABLE recharge ENABLE ROW LEVEL SECURITY;

-- 创建策略 (允许所有操作)
DROP POLICY IF EXISTS "Allow all access to recharge" ON recharge;
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
CREATE INDEX IF NOT EXISTS idx_transaction_type ON transaction(type);

ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to transaction" ON transaction;
CREATE POLICY "Allow all access to transaction" ON transaction FOR ALL USING (true) WITH CHECK (true);

-- 创建充值记录表
CREATE TABLE IF NOT EXISTS recharge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(255) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  address VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiresAt TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_userId ON recharge(userId);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON recharge(status);
CREATE INDEX IF NOT EXISTS idx_recharge_createdAt ON recharge(createdAt DESC);

-- 允许匿名访问 (如果是 RLS)
ALTER TABLE recharge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recharge" ON recharge FOR ALL USING (true) WITH CHECK (true);

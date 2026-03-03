-- BB Market 资金托管系统 - 数据库字段补充
-- 为现有 Wallet 表添加 locked 字段（如果尚未存在）

-- 检查并添加 locked 字段到 Wallet 表
DO $$ 
BEGIN
  -- 检查字段是否存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Wallet' AND column_name = 'locked'
  ) THEN
    ALTER TABLE "Wallet" ADD COLUMN locked DECIMAL(20,2) DEFAULT 0;
    COMMENT ON COLUMN "Wallet".locked IS '锁定金额（用于托管支付）';
  END IF;
  
  -- 检查 frozen 字段是否存在（某些表可能没有）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Wallet' AND column_name = 'frozen'
  ) THEN
    ALTER TABLE "Wallet" ADD COLUMN frozen DECIMAL(20,2) DEFAULT 0;
    COMMENT ON COLUMN "Wallet".frozen IS '冻结金额（托管充值）';
  END IF;
END $$;

-- 检查 Order 表是否有 escrowStatus 字段
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name = 'escrowStatus'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN escrowStatus VARCHAR(50) DEFAULT 'NONE';
    COMMENT ON COLUMN "Order".escrowStatus IS '托管状态: NONE, LOCKED, RELEASED, REFUNDED';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name = 'escrowLockedAt'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN escrowLockedAt TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' AND column_name = 'escrowReleasedAt'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN escrowReleasedAt TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 为 Recharge 表添加 orderIds 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recharge' AND column_name = 'orderIds'
  ) THEN
    ALTER TABLE "recharge" ADD COLUMN orderIds TEXT;
  END IF;
END $$;

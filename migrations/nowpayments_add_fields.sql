-- NowPayments 对接数据库迁移
-- 添加 NowPayments 相关字段到 recharge 表

-- 添加 NowPayments ID 字段
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS nowpaymentsId VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS nowpaymentsStatus VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS payAmount VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS payCurrency VARCHAR(20);

-- 添加支付完成时间
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS paymentId VARCHAR(50);
ALTER TABLE recharge ADD COLUMN IF NOT EXISTS txId VARCHAR(100);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recharge_nowpayments_id ON recharge(nowpaymentsId);
CREATE INDEX IF NOT EXISTS idx_recharge_nowpayments_status ON recharge(nowpaymentsStatus);

-- 注意：确保已有余额字段
-- ALTER TABLE "user" ADD COLUMN IF NOT EXISTS balance DECIMAL(20, 8) DEFAULT 0;

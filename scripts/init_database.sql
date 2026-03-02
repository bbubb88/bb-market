-- BB Market 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行

-- 1. 创建 Listing 表（如果不存在）
CREATE TABLE IF NOT EXISTS "Listing" (
    id SERIAL PRIMARY KEY,
    seller_id TEXT,
    type TEXT DEFAULT 'account',
    title TEXT NOT NULL,
    title_ko TEXT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    level INTEGER,
    amount INTEGER DEFAULT 1,
    images JSONB DEFAULT '[]',
    badge TEXT,
    server_id TEXT,
    status TEXT DEFAULT 'selling',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 Wallet 表（如果不存在）
CREATE TABLE IF NOT EXISTS "Wallet" (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 Transaction 表（如果不存在）
CREATE TABLE IF NOT EXISTS "Transaction" (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 插入测试商品数据
INSERT INTO "Listing" (id, seller_id, type, title, title_ko, description, price, level, badge, status, created_at)
VALUES 
(1, 'test-seller-1', 'account', '高端战士号 - 满级装备', '高端 워리어账号 - 만렙 장비', '80级战士，全套顶级装备，稀有坐骑', 150, 80, 'hot', 'selling', NOW()),
(2, 'test-seller-2', 'account', '法师顶级账号', '메이지顶级账号', '90级法师毕业装备', 200, 90, 'new', 'selling', NOW()),
(3, 'test-seller-3', 'item', '稀有强化石x100', '레어 강화석x100', '高强化成功率道具', 50, NULL, 'hot', 'selling', NOW()),
(4, 'test-seller-4', 'coin', '金币1亿', '골드 1억', '快速交易金币', 100, NULL, 'new', 'selling', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. 给 public 表添加 RLS 策略（可选）
ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- 允许多读
CREATE POLICY "Enable read access for all users" ON "Listing" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "Wallet" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "Transaction" FOR SELECT USING (true);

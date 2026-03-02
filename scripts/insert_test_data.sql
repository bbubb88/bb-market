-- 在 Supabase SQL Editor 中运行此脚本

-- 插入测试商品数据
INSERT INTO "Listing" (id, seller_id, type, title, title_ko, description, price, level, badge, status, created_at)
VALUES 
(1, 'test-seller-1', 'account', '高端战士号 - 满级装备', '高端 워리어账号 - 만렙 장비', '80级战士，全套顶级装备，稀有坐骑', 150, 80, 'hot', 'selling', NOW()),
(2, 'test-seller-2', 'account', '法师顶级账号', '메이지顶级账号', '90级法师毕业装备', 200, 90, 'new', 'selling', NOW()),
(3, 'test-seller-3', 'item', '稀有强化石x100', '레어 강화석x100', '高强化成功率道具', 50, NULL, 'hot', 'selling', NOW()),
(4, 'test-seller-4', 'coin', '金币1亿', '골드 1억', '快速交易金币', 100, NULL, 'new', 'selling', NOW());

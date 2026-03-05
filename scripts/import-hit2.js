/**
 * DD373 HIT2 商品爬虫 - 导入到 BB Market
 * 运行: node scripts/import-hit2.js
 */

const SUPABASE_URL = 'https://ytsqawvrgzxgfluuadao.supabase.co';
const SUPABASE_KEY = 'sb_secret_4ynjxIudgE1ydSb3SR1a5A_gJGbGN5o';

const GAME_ID = 'hit2';

// 模拟从dd373抓取的数据
const mockProducts = [
  {
    title: '100000钻石',
    description: '日服/Anica1，支持跨服拍卖',
    price: 1500.00,
    type: 'coins',
    server: '日服/Anica1',
    source: 'dd373',
    source_id: 'DB20260108204235-23216'
  },
  {
    title: '50000钻石',
    description: '日服/Lucas1，单件交易',
    price: 750.00,
    type: 'coins',
    server: '日服/Lucas1',
    source: 'dd373',
    source_id: 'DB20260104161643-94666'
  },
  {
    title: '100000钻石',
    description: '日服/Kiki1，不支持跨服',
    price: 1600.00,
    type: 'coins',
    server: '日服/Kiki1',
    source: 'dd373',
    source_id: 'DB20260304104533-47748'
  },
  {
    title: '25000钻石',
    description: '台服/阿黛爾1',
    price: 775.00,
    type: 'coins',
    server: '台服/阿黛爾1',
    source: 'dd373',
    source_id: 'DB20260303224532-52393'
  },
  {
    title: '50000钻石',
    description: '台服/阿妮卡1',
    price: 1570.00,
    type: 'coins',
    server: '台服/阿妮卡1',
    source: 'dd373',
    source_id: 'DB20260228204059-97908'
  }
];

async function checkGameExists() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/Game?id=eq.${GAME_ID}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await response.json();
  return data && data.length > 0;
}

async function createGameIfNotExists() {
  const exists = await checkGameExists();
  if (exists) {
    console.log('✅ HIT2 游戏已存在');
    return;
  }
  
  const game = {
    id: GAME_ID,
    name: 'HIT2',
    name_en: 'HIT2',
    description: 'HIT2 游戏账号道具交易',
    icon_url: '/games/hit2.png',
    status: 'active'
  };
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/Game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(game)
  });
  
  if (response.ok) {
    console.log('✅ 创建 HIT2 游戏成功');
  } else {
    console.log('❌ 创建游戏失败:', response.statusText);
  }
}

async function insertListing(listing) {
  const data = {
    sellerId: 'test-seller-1',  // 测试卖家
    gameId: GAME_ID,
    serverId: null,
    type: listing.type,  // account, item, coins
    title: listing.title,
    titleKo: null,
    description: listing.description,
    descriptionKo: null,
    price: listing.price,
    level: null,
    amount: null,
    images: [],
    badge: null,
    status: 'SELLING',
    viewCount: 0
  };
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/Listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const err = await response.text();
    console.log('   错误:', err);
  }
  return response.ok;
}

async function main() {
  console.log('🚀 开始导入 DD373 HIT2 商品...\n');
  
  // 1. 确保游戏存在
  await createGameIfNotExists();
  
  // 2. 导入商品
  let successCount = 0;
  for (const p of mockProducts) {
    const ok = await insertListing(p);
    if (ok) {
      successCount++;
      console.log(`✅ 导入: ${p.title} - ¥${p.price} (${p.server})`);
    } else {
      console.log(`❌ 失败: ${p.title}`);
    }
  }
  
  console.log(`\n🎉 完成！成功导入 ${successCount}/${mockProducts.length} 个商品`);
}

main().catch(console.error);

/**
 * DD373 HIT2 批量导入脚本 - 模拟真人上架风格
 * 运行: node scripts/import-hit2-full.js
 */

const SUPABASE_URL = 'https://ytsqawvrgzxgfluuadao.supabase.co';
const SUPABASE_KEY = 'sb_secret_4ynjxIudgE1ydSb3SR1a5A_gJGbGN5o';
const GAME_ID = 'hit2';

// 模拟真人卖家
const sellers = [
  '游戏玩家001', 'HIT2老玩家', '账号商人A', '工作室出号', 
  '退役玩家', '急需用钱', '氪金大佬', '回流玩家',
  '商人小张', '玩家小王', '全职商人', '良心卖家'
];

// 随机选择卖家
function randomSeller() {
  return sellers[Math.floor(Math.random() * sellers.length)];
}

// 随机生成日期（过去7天内）
function randomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 7);
  now.setDate(now.getDate() - daysAgo);
  return now.toISOString();
}

// 真人风格的标题生成器
function makeRealTitle(type, data) {
  const prefixes = ['✨', '🔥', '💎', '⚡', '🎮', '🛒', '❤️', '💰'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  if (type === 'account') {
    // 游戏账号
    const titles = [
      `${prefix} ${data.level}级${data.job}账号 - ${data.highlight}`,
      `${prefix} 出${data.job}号 - ${data.highlight}`,
      `${prefix} ${data.server} ${data.job}账号 - ${data.highlight}`,
      `${prefix} 自玩${data.job}号 - ${data.highlight}`,
      `${prefix} 毕业${data.job}号 - ${data.highlight}`,
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  } else {
    // 游戏币
    return `${prefix} ${data.amount}钻石 - ${data.server} - 诚信交易`;
  }
}

// 真人风格的描述
function makeRealDescription(type, data) {
  if (type === 'account') {
    return `${data.description}\n\n📍 区服: ${data.server}\n🎮 职业: ${data.job}\n💪 等级: ${data.level}级\n✨ 特点: ${data.highlight}\n\n✅ 安全交易，可小刀\n📦 立即发货\n💬 欢迎咨询`;
  } else {
    return `💰 诚信交易，数量充足\n📍 区服: ${data.server}\n⚡ 快速到账\n\n支持USDT/微信/支付宝\n有意请联系`;
  }
}

// ============ 游戏账号数据 (从dd373抓取) ============
const accounts = [
  { level: 58, job: '刺客', server: '平衡服/路米亞1', price: 777, highlight: '三维1100，四金变身', description: '58级刺客，三维1100，四金变身，账号安全无异常' },
  { level: 46, job: '战士', server: '平衡服/路米亞4', price: 100, highlight: '双紫卡带655钻石', description: '46级双紫卡带655钻石，NE账号微软邮箱' },
  { level: '高', job: '法师', server: '平衡服/路米亞1', price: 4500, highlight: '6金人宠物6+1紫武', description: '6金人宠物6+1紫武，装备毕业' },
  { level: 50, job: '弓手', server: '平衡服/克魯斯塔4', price: 700, highlight: '7个弓手50级多件蓝装', description: '7个弓手50级多件蓝装还有金皮角色和大量可交易材料' },
  { level: 54, job: '法师', server: '平衡服/路米亞1', price: 222, highlight: '手搓54金皮金寵', description: '手搓54金皮金寵，详情看图' },
  { level: '高', job: '弓手', server: '平衡服/路米亞1', price: 666, highlight: '三維900+紫卡紫寵', description: '三維基本差不多，全部紫變身，紫寶寶 個別金寶寶' },
  { level: '高', job: '弓手', server: '平衡服/路米亞1', price: 355, highlight: '手搓號900+三維', description: '手搓號，三位900+，紫卡紫寵' },
  { level: '高', job: '弓手', server: '平衡服/路米亞1', price: 455, highlight: '900+三维金卡紫寵', description: '手搓账号 900+三维 金卡紫寵 详情看图' },
  { level: '高', job: '法师', server: '平衡服/因費爾多斯4', price: 280, highlight: '双金打币机900三维', description: '双金打币机，900三维，详情下单' },
  { level: '高', job: '弓手', server: '平衡服/路米亞4', price: 88, highlight: '奶妈弓手打币机', description: '奶妈弓手打币机，可小刀' },
  { level: '高', job: '弓手', server: '平衡服/亞拉克奈斯1', price: 150, highlight: '900左右双金单金打币机', description: '900左右三维，双金单金打币机，详情拍下沟通' },
  { level: '高', job: '弓手', server: '台服/阿妮卡3', price: 11999, highlight: '急售双枪拳符文全满', description: '急售双枪，拳，符文全满，虚空除了新出的全满，龙伤4500万左右' },
  { level: '高', job: '弓手', server: '平衡服/亞拉克奈斯3', price: 400, highlight: '三维900的弓手', description: '三维900的弓手，真心喜欢，价格好商量' },
  { level: '高', job: '祭司', server: '平衡服/路米亞4', price: 300, highlight: '双金紫坐骑58+', description: '双金紫坐骑58+最新通行证账号' },
  { level: '高', job: '弓手', server: '台服/雨果2', price: 7999, highlight: '双红枪手3600+', description: '双红枪手3600+，打龙1800万' },
  { level: 54, job: '祭司', server: '平衡服/路米亞1', price: 188, highlight: '手搓54金皮紫寶寶奶', description: '手搓54金皮紫寶寶奶 詳情如圖' },
  { level: '高', job: '刺客', server: '台服/雨果3', price: 9999, highlight: '红枪拳双修3红账号', description: '红枪拳双修3红账号三维4000打龙2000w' },
  { level: 30, job: '祭司', server: '平衡服/克魯斯塔1', price: 20, highlight: '30级奶妈双蓝', description: '30级奶妈双蓝个人谷歌' },
  { level: 49, job: '祭司', server: '平衡服/克魯斯塔1', price: 350, highlight: '49级奶妈号10个', description: '现在都快50级了，有9件蓝装，10个号都充过钱' },
  { level: '高', job: '多职业', server: '台服/雨果1', price: 55, highlight: '雨果1-2-3-4-5都有号', description: '雨果1-2-3-4-5都有号，充值过通行证' },
];

// ============ 游戏币数据 (从dd373抓取) ============
const coins = [
  { amount: 100000, server: '日服/Anica1', price: 1500 },
  { amount: 50000, server: '日服/Lucas1', price: 750 },
  { amount: 100000, server: '日服/Kiki1', price: 1600 },
  { amount: 10000, server: '日服/Kiki1', price: 160 },
  { amount: 10000, server: '日服/Anica1', price: 180 },
  { amount: 10000, server: '日服/Lucas1', price: 190 },
  { amount: 10000, server: '日服/Hugo1', price: 220 },
  { amount: 3508, server: '台服/卢卡斯5', price: 105 },
  { amount: 5106, server: '台服/卢卡斯5', price: 153 },
  { amount: 3966, server: '台服/阿妮卡5', price: 119 },
  { amount: 25000, server: '台服/阿黛爾1', price: 775 },
  { amount: 2827, server: '台服/阿妮卡1', price: 88 },
  { amount: 5188, server: '台服/阿妮卡1', price: 162 },
  { amount: 30554, server: '台服/阿黛爾1', price: 956 },
  { amount: 37069, server: '台服/阿黛爾1', price: 1160 },
  { amount: 67613, server: '台服/阿黛爾1', price: 2116 },
  { amount: 8517, server: '台服/阿妮卡1', price: 267 },
  { amount: 2934, server: '台服/阿妮卡1', price: 92 },
  { amount: 50000, server: '台服/阿妮卡1', price: 1570 },
  { amount: 15663, server: '台服/阿黛爾1', price: 492 },
];

async function insertListing(listing) {
  const data = {
    sellerId: 'test-seller-1',
    gameId: GAME_ID,
    serverId: null,
    type: listing.type,
    title: listing.title,
    titleKo: null,
    description: listing.description,
    descriptionKo: null,
    price: listing.price,
    level: listing.level || null,
    amount: listing.amount || null,
    images: listing.images || [],
    badge: listing.badge || null,
    status: 'SELLING',
    viewCount: Math.floor(Math.random() * 100),
    createdAt: listing.createdAt || new Date().toISOString()
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
  
  return response.ok;
}

async function main() {
  console.log('🚀 开始批量导入 DD373 HIT2 商品...\n');
  console.log('📋 导入策略: 模拟真人上架风格\n');

  // 先清空旧的测试数据
  console.log('🧹 清理旧数据...');
  
  let totalSuccess = 0;

  // ============ 导入游戏账号 ============
  console.log('\n📦 导入游戏账号...');
  for (const acc of accounts) {
    const listing = {
      type: 'account',
      title: makeRealTitle('account', acc),
      description: makeRealDescription('account', acc),
      price: acc.price,
      level: typeof acc.level === 'number' ? acc.level : null,
      amount: null,
      images: [],
      badge: Math.random() > 0.7 ? 'hot' : null,
      createdAt: randomDate()
    };
    
    const ok = await insertListing(listing);
    if (ok) {
      totalSuccess++;
      console.log(`  ✅ ${listing.title} - ¥${listing.price}`);
    }
  }

  // ============ 导入游戏币 ============
  console.log('\n💰 导入游戏币...');
  for (const coin of coins) {
    const listing = {
      type: 'coins',
      title: makeRealTitle('coins', coin),
      description: makeRealDescription('coins', coin),
      price: coin.price,
      level: null,
      amount: coin.amount,
      images: [],
      badge: Math.random() > 0.8 ? 'hot' : null,
      createdAt: randomDate()
    };
    
    const ok = await insertListing(listing);
    if (ok) {
      totalSuccess++;
      console.log(`  ✅ ${listing.title} - ¥${listing.price}`);
    }
  }

  console.log(`\n🎉 全部完成！成功导入 ${totalSuccess} 个商品`);
  console.log(`   - 游戏账号: ${accounts.length} 个`);
  console.log(`   - 游戏币: ${coins.length} 个`);
}

main().catch(console.error);

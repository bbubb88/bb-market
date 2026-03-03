import { NextRequest, NextResponse } from 'next/server';

const CUSTOMER_SERVICE_AGENT = 'customer'; // 客服 Agent 代号

function getContextPrompt(): string {
  return `你是 BB Market 的专业客服。请根据以下信息回答用户问题。

【平台信息】
- 名称：BB Market
- 类型：游戏道具交易平台（账号、道具、游戏币）
- 支持游戏：HIT2等热门游戏
- 支付：USDT (TRC20)
- 安全：资金担保交易

【常见问题回答】
购买流程：注册账号 → 选择商品 → USDT支付 → 收到商品
挂售流程：登录账号 → 点击挂售 → 填写信息 → 等待卖出
安全问题：买家确认收货后才放行资金，7×24客服保障

请用中文、友好地回答用户问题。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, userId, adminMode } = body;

    if (adminMode === 'true') {
      return NextResponse.json({ success: true, from: 'admin' });
    }

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 这里可以接入真正的 Subagent
    // 目前先用智能回复
    const reply = generateSmartReply(message);

    return NextResponse.json({ 
      success: true, 
      reply: reply,
      from: 'ai'
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

function generateSmartReply(message: string): string {
  const msg = message.toLowerCase();
  const ctx = getContextPrompt();
  
  // 问候
  if (msg.includes('你好') || msg.includes('hello') || msg.includes('hi') || msg.includes('在吗')) {
    return '你好！👋 我是 BB Market 智能客服，请问有什么可以帮到你？';
  }
  
  // 购买相关
  if (msg.includes('买') || msg.includes('购买') || msg.includes('怎么买')) {
    return '购买很简单的！流程如下：\n\n1. 访问 https://bb-market-next.vercel.app\n2. 注册/登录账号\n3. 选择想要的商品\n4. 使用 USDT (TRC20) 支付\n5. 收到商品\n\n有问题随时问我～';
  }
  
  // 挂售相关
  if (msg.includes('卖') || msg.includes('挂售') || msg.includes('出售') || msg.includes('怎么卖')) {
    return '挂售流程：\n\n1. 登录账号\n2. 点击"挂售"按钮\n3. 填写商品信息（类型、价格等）\n4. 发布商品\n5. 买家购买后收到钱\n\n我们提供资金担保，卖出去后才放行资金，安全有保障！';
  }
  
  // 支付相关
  if (msg.includes('支付') || msg.includes('付款') || msg.includes('usdt') || msg.includes('钱')) {
    return '我们支持 USDT (TRC20) 支付：\n\n• 最低充值 5 USDT\n• 支付地址：TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh\n• 支付后自动到账\n\n有其他支付问题吗？';
  }
  
  // 安全相关
  if (msg.includes('安全') || msg.includes('靠谱') || msg.includes('放心') || msg.includes('骗')) {
    return '安全问题完全放心！我们提供：\n\n✅ 资金担保 - 买家确认收货才放行\n✅ 7×24客服 - 随时解决问题\n✅ 交易保障 - 纠纷先行赔付\n\n平台运营多年，口碑良好！';
  }
  
  // 游戏相关
  if (msg.includes('游戏') || msg.includes('hit2') || msg.includes('HIT2')) {
    return '我们支持 HIT2 等热门游戏的：\n\n🎮 账号交易\n🎁 道具装备\n💰 游戏金币\n\n访问 https://bb-market-next.vercel.app/hit2 看看有没有你想要的！';
  }
  
  // 联系客服
  if (msg.includes('人工') || msg.includes('联系') || msg.includes('电话') || msg.includes('email')) {
    return '联系我们：\n\n📧 邮箱：support@bbmarket.com\n📞 电话：+852 4406 0902\n💬 在线客服：我就是 😊\n\n一般问题我都能解答，复杂问题会帮你转人工！';
  }
  
  // 谢谢
  if (msg.includes('谢谢') || msg.includes('感谢') || msg.includes('好的') || msg.includes('明白')) {
    return '不客气！😊 很高兴能帮到你！还有其他问题吗？';
  }
  
  // 不知道的问题
  return '感谢你的消息！我是 BB Market 智能客服，已经了解你的问题。\n\n你也可以：\n• 访问 https://bb-market-next.vercel.app 了解更多信息\n• 发送邮件 support@bbmarket.com\n\n请问还有其他可以帮到你的吗？';
}

import { NextRequest, NextResponse } from 'next/server';

// 简单的客服 Agent 回复逻辑
function generateReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  // 常见问题回复
  if (msg.includes('你好') || msg.includes('hello') || msg.includes('hi')) {
    return '你好！欢迎来到 BB Market！有什么可以帮助你的？';
  }
  
  if (msg.includes('怎么') || msg.includes('如何')) {
    if (msg.includes('买') || msg.includes('购买')) {
      return '购买流程：1. 注册账号 → 2. 选择商品 → 3. USDT 支付 → 4. 收到商品。有任何问题可以随时问我！';
    }
    if (msg.includes('卖') || msg.includes('挂售')) {
      return '挂售流程：1. 登录账号 → 2. 点击"挂售" → 3. 填写商品信息 → 4. 等待买家购买。保证金安全有保障！';
    }
    if (msg.includes('支付') || msg.includes('付款')) {
      return '我们支持 USDT (TRC20) 支付，安全快速！最低充值 5 USDT。';
    }
    return '请告诉我具体你想了解什么？我会尽力帮助你的！';
  }
  
  if (msg.includes('价格') || msg.includes('多少钱')) {
    return '不同商品价格不同，您可以访问 https://bb-market-next.vercel.app 选择游戏和商品查看具体价格。';
  }
  
  if (msg.includes('游戏')) {
    return '我们支持 HIT2 等热门游戏的账号、道具、金币交易！访问首页选择您感兴趣的游戏。';
  }
  
  if (msg.includes('安全') || msg.includes('靠谱')) {
    return '我们提供资金担保交易！买家确认收货后才放行资金，7×24客服保障，安全无忧！';
  }
  
  if (msg.includes('联系') || msg.includes('客服') || msg.includes('人工')) {
    return '我是 AI 客服，可以解答大部分问题。如需人工服务，请发送邮件至 support@bbmarket.com';
  }
  
  if (msg.includes('谢谢') || msg.includes('感谢')) {
    return '不客气！很高兴能帮到你！还有其他问题吗？';
  }
  
  // 默认回复
  return '感谢您的消息！我是 BB Market 智能客服，已经记录您的问题。一般问题我可以即时解答，复杂问题会转交人工处理。请问还有什么可以帮到你？';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, userId, adminMode } = body;

    // 客服人工回复模式
    if (adminMode === 'true') {
      // 人工回复逻辑（在另一个 API 处理）
      return NextResponse.json({ success: true, from: 'admin' });
    }

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 生成 AI 回复
    const reply = generateReply(message);

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

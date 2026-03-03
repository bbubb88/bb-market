import { NextRequest, NextResponse } from 'next/server';

// DeepSeek API Key - 也可以直接写在这里方便调试
// 生产环境建议用环境变量
const DEFAULT_DEEPSEEK_KEY = 'sk-4121802f53ba444ca18c732f896742f1';

// 客服系统提示词
const SYSTEM_PROMPT = `你是 BB Market 的专业智能客服，代表平台形象。

【平台信息】
- 名称：BB Market
- 类型：游戏道具交易平台
- 支持：HIT2游戏账号、道具、金币交易
- 支付：USDT (TRC20)
- 特点：资金担保、7×24客服

【回答风格】
- 友好、专业
- 用中文回复
- 简洁明了
- 适当用emoji
- 引导用户操作

【常见问题】
- 购买流程：注册→选商品→USDT支付→收货
- 挂售流程：登录→挂售→填信息→等待卖出
- 安全：资金担保，买家确认才放行`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, adminMode } = body;

    if (adminMode === 'true') {
      return NextResponse.json({ success: true, from: 'admin' });
    }

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 如果没有配置 DeepSeek API，使用默认Key
    const apiKey = process.env.DEEPSEEK_API_KEY || DEFAULT_DEEPSEEK_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        reply: '抱歉，AI客服暂时忙碌。请稍后再试或联系 support@bbmarket.com',
        from: 'ai'
      });
    }

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解你的问题。';

      return NextResponse.json({
        success: true,
        reply: reply,
        from: 'ai'
      });
    }

    // 成功响应
    const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解你的问题。';

    return NextResponse.json({
      success: true,
      reply: reply,
      from: 'ai'
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      success: true,
      reply: '抱歉，出了点问题。请稍后再试。',
      from: 'ai'
    });
  }
}

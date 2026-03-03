import { NextRequest, NextResponse } from 'next/server';

// 智能客服回复系统
function generateSmartReply(message: string, userEmail?: string): string {
  const msg = message.toLowerCase();
  const userName = userEmail ? userEmail.split('@')[0] : '朋友';
  
  // 智能意图识别
  const intents = detectIntent(msg);
  
  // 如果匹配到明确意图
  if (intents.greeting) {
    return `你好${userName}！🎮 欢迎来到 BB Market！

我是你的专属客服，很高兴为你服务！

我可以帮你：
📦 了解如何购买商品
💰 了解如何挂售商品
💳 了解支付方式
🔒 了解交易安全保障
❓ 解答其他问题

请问有什么想了解的？`;
  }
  
  if (intents.buy) {
    return `📦 **购买流程** 超简单！

**步骤：**
1️⃣ 访问 ${'https://bb-market-next.vercel.app'}
2️⃣ 注册/登录账号
3️⃣ 选择心仪的商品
4️⃣ 使用 USDT (TRC20) 支付
5️⃣ 收到商品，确认收货

💡 **小贴士：**
- 首次购买建议从小额开始
- 热门商品抢手，看中就下手
- 有问题随时找我！

想了解哪个游戏的商品？`;
  }
  
  if (intents.sell) {
    return `💰 **挂售流程** 很简单！

**步骤：**
1️⃣ 登录账号
2️⃣ 点击"挂售"按钮
3️⃣ 选择游戏，填写商品信息
4️⃣ 设置价格，发布商品
5️⃣ 买家购买后，钱自动到账

✅ **安全保障：**
- 资金担保：买家确认收货才放行
- 不用担心买家不付款
- 7×24客服随时处理问题

现在就去挂售你的商品吧！`;
  }
  
  if (intents.payment) {
    return `💳 **支付方式**

我们支持 **USDT (TRC20)** 支付！

**充值步骤：**
1. 前往钱包 → 充值
2. 输入充值金额（最低5 USDT）
3. 转账到指定地址
4. 自动到账

📍 **USDT地址：**
\`TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh\`

⚠️ **注意：**
- 只接受 TRC20 网络
- 转账备注请填写订单号
- 有问题截图给我看`;
  }
  
  if (intents.safety) {
    return `🔒 **安全保障** 请放心！

我们提供多重保障：

✅ **资金担保**
- 买家确认收货后，资金才放行给卖家
- 交易全程平台托管

✅ **7×24客服**
- 任何问题随时找我
- 纠纷第一时间处理

✅ **信誉体系**
- 买卖双方都有评价
- 信誉好，交易更顺畅

❓ 还有其他安全问题吗？`;
  }
  
  if (intents.game) {
    return `🎮 **热门游戏**

目前支持 **HIT2** 游戏交易！

**交易类型：**
- 📋 账号交易
- 🎁 道具装备
- 💰 游戏金币

🔜 更多游戏即将上线！

告诉我你想交易什么？`;
  }
  
  if (intents.contact) {
    return `📞 **联系我们**

💬 在线客服：我就是！
📧 邮箱：support@bbmarket.com
💻 网站：https://bb-market-next.vercel.app

一般问题我都能解答，复杂问题会帮你转人工！

还想了解什么？`;
  }
  
  if (intents.thanks) {
    return `😊 不客气！${userName}

很高兴能帮到你！

记得：
- 遇到问题随时找我
- 关注平台活动有优惠
- 交易愉快！🎮

还有其他需要帮助的吗？`;
  }
  
  if (intents.price || msg.includes('多少钱') || msg.includes('价格')) {
    return `💵 **商品价格**

不同商品价格不同！

**如何查看价格：**
1. 访问 ${'https://bb-market-next.vercel.app'}
2. 选择游戏和商品类型
3. 浏览商品列表，每个都有标注价格

💡 **议价技巧：**
- 可以和卖家协商价格
- 热门商品一般不讲价
- 私聊功能即将上线！

告诉我你想买什么，我来帮你找！`;
  }
  
  if (intents.help || msg.includes('help') || msg.includes('帮助')) {
    return `❓ **我能帮你做什么？**

📦 **购买问题**
- 如何下单
- 支付方式
- 收货流程

💰 **挂售问题**
- 如何发布商品
- 定价技巧
- 收益提现

🔒 **安全问题**
- 资金保障
- 防骗指南
- 纠纷处理

💳 **支付问题**
- USDT充值
- 汇率问题
- 充值不到账

直接告诉我你想了解什么！`;
  }
  
  // 默认回复
  return `🤔 ${userName}，你的问题我收到了！

让我帮你整理一下：

📦 **购买** → 告诉我"怎么购买"
💰 **挂售** → 告诉我"怎么卖"
💳 **支付** → 告诉我"怎么付款"
🔒 **安全** → 告诉我"安全吗"

或者直接描述你的问题，我尽量帮你解答！😊`;
}

// 意图识别
function detectIntent(msg: string) {
  return {
    greeting: /^(你好|hi|hello|在吗|您好|hey|嗨)/.test(msg) || msg.length < 5,
    buy: /购买|买|怎么买|如何买|想买|下单|购物/.test(msg),
    sell: /卖|挂售|出售|怎么卖|我想卖|发布商品|开店/.test(msg),
    payment: /支付|付款|充值|转账|USDT|钱|怎么付/.test(msg),
    safety: /安全|靠谱|放心|信任|骗|风险|保障/.test(msg),
    game: /游戏|HIT2|道具|账号|金币|游戏币/.test(msg),
    contact: /联系|客服|电话|邮箱|email|微信|line/.test(msg),
    thanks: /谢谢|感谢|好的|明白|知道了|感恩/.test(msg),
    price: /价格|多少钱|便宜|贵|优惠|折扣/.test(msg),
    help: /帮助|help|assist|帮忙|问题|怎么办/.test(msg),
  };
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

    // 智能回复
    const reply = generateSmartReply(message, userEmail);

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

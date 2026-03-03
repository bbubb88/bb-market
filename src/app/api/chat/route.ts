import { NextRequest, NextResponse } from 'next/server';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SUPPORT_CHANNEL_ID = process.env.DISCORD_SUPPORT_CHANNEL_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, userId } = body;

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 如果配置了 Discord 频道，发送消息到 Discord
    if (DISCORD_BOT_TOKEN && SUPPORT_CHANNEL_ID) {
      const discordMessage = {
        content: `📬 **新客服消息**\n\n**用户:** ${userEmail || userId || '游客'}\n**消息:** ${message}`,
      };

      const discordRes = await fetch(
        `https://discord.com/api/v10/channels/${SUPPORT_CHANNEL_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(discordMessage),
        }
      );

      if (!discordRes.ok) {
        const error = await discordRes.text();
        console.error('Discord API error:', error);
        return NextResponse.json({ error: '发送到Discord失败' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: '消息已发送' });
    }

    // 没有配置 Discord 时，返回模拟成功
    return NextResponse.json({ 
      success: true, 
      message: '消息已收到（暂未配置Discord通道）',
      debug: true 
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

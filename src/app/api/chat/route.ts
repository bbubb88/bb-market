import { NextRequest, NextResponse } from 'next/server';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// 简单内存存储（生产环境应该用数据库）
const messages: Array<{
  id: number;
  userId: string;
  userEmail: string;
  message: string;
  isFromAdmin: boolean;
  adminId: string;
  createdAt: string;
  read: boolean;
}> = [];

let messageId = 1;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      // 客服查看所有消息
      return NextResponse.json({ 
        messages: messages.filter(m => !m.isFromAdmin).reverse() 
      });
    }

    // 用户查看自己的消息
    if (userId) {
      const userMessages = messages.filter(m => m.userId === userId);
      return NextResponse.json({ messages: userMessages });
    }

    return NextResponse.json({ messages: [] });
  } catch (error) {
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, userId, adminId, adminReply, adminMode } = body;

    if (adminMode === 'true' && adminId) {
      // 客服回复消息
      const newMessage = {
        id: messageId++,
        userId: userId || 'admin',
        userEmail: adminId,
        message: message,
        isFromAdmin: true,
        adminId: adminId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      messages.push(newMessage);
      return NextResponse.json({ success: true, message: '回复成功' });
    }

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 用户发送消息
    const newMessage = {
      id: messageId++,
      userId: userId || `guest_${Date.now()}`,
      userEmail: userEmail || '游客',
      message: message,
      isFromAdmin: false,
      adminId: '',
      createdAt: new Date().toISOString(),
      read: false,
    };
    messages.push(newMessage);

    // 发送到 Discord（如果有配置）
    if (DISCORD_BOT_TOKEN) {
      const channelId = process.env.DISCORD_SUPPORT_CHANNEL_ID;
      if (channelId) {
        await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `📬 **新客服消息**\n**用户:** ${userEmail || '游客'}\n**消息:** ${message}`
          }),
        });
      }
    }

    return NextResponse.json({ success: true, message: '发送成功' });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

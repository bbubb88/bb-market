// Discord 机器人通知功能

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * 通过 Discord Bot 发送私信给用户
 */
export async function sendDiscordDM(userId: string, message: string): Promise<boolean> {
  try {
    // 先创建 DM 频道
    const dmResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        recipient_id: userId,
      }),
    });

    if (!dmResponse.ok) {
      console.error('Failed to create DM channel:', await dmResponse.text());
      return false;
    }

    const dmChannel = await dmResponse.json();
    const channelId = dmChannel.id;

    // 发送消息
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!messageResponse.ok) {
      console.error('Failed to send message:', await messageResponse.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Discord DM error:', error);
    return false;
  }
}

/**
 * 发送订单通知给买家
 */
export async function notifyBuyerOfOrder(
  buyerDiscordId: string,
  orderData: {
    orderId: string;
    listingTitle: string;
    price: number;
    sellerName: string;
  }
): Promise<boolean> {
  const message = `🎉 **新订单通知**

您好！您有一笔新订单：

📦 **商品**: ${orderData.listingTitle}
💰 **价格**: $${orderData.price}
👤 **卖家**: ${orderData.sellerName}

请尽快完成付款，以确保交易顺利进行。

查看订单详情: https://bb-market-next.vercel.app/dashboard/orders`;

  return sendDiscordDM(buyerDiscordId, message);
}

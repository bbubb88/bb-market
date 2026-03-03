// Discord 机器人通知功能

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

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

/**
 * 发送订单付款成功通知给卖家（持续发送直到卖家确认）
 */
export async function notifySellerOfPayment(
  orderId: string,
  sellerDiscordId: string,
  orderData: {
    listingTitle: string;
    price: number;
    buyerUsername: string;
  }
): Promise<boolean> {
  const message = `🚨 **订单已付款，请尽快发货！**

您好！您有新的订单已付款：

📦 **商品**: ${orderData.listingTitle}
💰 **金额**: $${orderData.price}
👤 **买家**: ${orderData.buyerUsername}

请尽快安排发货，发货后请点击下方链接确认：
👉 https://bb-market-next.vercel.app/dashboard/orders

⚠️ **重要**：未及时处理可能影响您的店铺评分`;

  const success = await sendDiscordDM(sellerDiscordId, message);
  
  if (success) {
    // 记录通知发送状态
    await recordSellerNotification(orderId, sellerDiscordId);
  }
  
  return success;
}

/**
 * 记录卖家通知发送状态
 */
async function recordSellerNotification(orderId: string, sellerDiscordId: string) {
  try {
    // 检查是否已有记录
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/SellerNotification?orderId=eq.${orderId}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const existing = await checkRes.json();
    
    if (existing && existing.length > 0) {
      // 更新发送次数和最后发送时间
      await fetch(
        `${SUPABASE_URL}/rest/v1/SellerNotification?orderId=eq.${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            sentCount: existing[0].sentCount + 1,
            lastSentAt: new Date().toISOString(),
          }),
        }
      );
    } else {
      // 创建新记录
      await fetch(`${SUPABASE_URL}/rest/v1/SellerNotification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          orderId,
          sellerDiscordId,
          sentCount: 1,
          firstSentAt: new Date().toISOString(),
          lastSentAt: new Date().toISOString(),
          sellerConfirmed: false,
        }),
      });
    }
  } catch (error) {
    console.error('Failed to record notification:', error);
  }
}

/**
 * 检查并重新发送未确认的卖家通知
 * 可由定时任务调用
 */
export async function checkAndResendSellerNotifications(): Promise<number> {
  if (!SUPABASE_KEY) {
    console.log('No SUPABASE_KEY, skipping notification check');
    return 0;
  }
  
  try {
    // 查找超过1小时未确认的订单通知
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/SellerNotification?sellerConfirmed=eq.false&lastSentAt=lt.${oneHourAgo}&sentCount=lt.5&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const notifications = await res.json();
    
    if (!notifications || notifications.length === 0) {
      return 0;
    }
    
    let resentCount = 0;
    for (const notif of notifications) {
      // 获取订单信息
      const orderRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Order?id=eq.${notif.orderId}&select=*,Listing:listingId(title)`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const orders = await orderRes.json();
      
      if (!orders || orders.length === 0 || orders[0].status !== 'PAID') {
        // 订单已处理，跳过
        continue;
      }
      
      const order = orders[0];
      const listing = order.Listing || {};
      
      // 重新发送通知
      const success = await sendDiscordDM(notif.sellerDiscordId, 
        `🔔 **提醒：您有订单待处理**
        
订单 ${notif.orderId.substring(0, 8)}... 尚未确认发货，请尽快处理！

📦 商品: ${listing.title || 'Unknown'}
💰 金额: $${order.price}

👉 https://bb-market-next.vercel.app/dashboard/orders
      `);
      
      if (success) {
        // 更新发送次数
        await fetch(
          `${SUPABASE_URL}/rest/v1/SellerNotification?orderId=eq.${notif.orderId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              sentCount: notif.sentCount + 1,
              lastSentAt: new Date().toISOString(),
            }),
          }
        );
        resentCount++;
      }
    }
    
    return resentCount;
  } catch (error) {
    console.error('Error checking notifications:', error);
    return 0;
  }
}

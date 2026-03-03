import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isPaymentCompleted, isPaymentFailed } from '@/lib/cryptomus';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=representation',
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

/**
 * 更新用户余额
 */
async function updateUserBalance(userId: string, amount: number): Promise<boolean> {
  try {
    // 先获取当前余额
    const { data: user } = await supabaseRequest(`user?id=eq.${userId}&select=balance`, {
      method: 'GET',
    });

    const currentBalance = user?.[0]?.balance || 0;
    const newBalance = currentBalance + amount;

    // 更新余额
    const { status } = await supabaseRequest(`user?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ balance: newBalance }),
    });

    return status >= 200 && status < 300;
  } catch (error) {
    console.error('[Cryptomus IPN] Update balance error:', error);
    return false;
  }
}

/**
 * 创建交易记录
 */
async function createTransaction(userId: string, amount: number, description: string): Promise<boolean> {
  try {
    const { status } = await supabaseRequest('transaction', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type: 'recharge',
        amount: amount,
        status: 'completed',
        description: description,
      }),
    });

    return status >= 200 && status < 300;
  } catch (error) {
    console.error('[Cryptomus IPN] Create transaction error:', error);
    return false;
  }
}

/**
 * Cryptomus IPN 回调处理
 * POST /api/recharge/cryptomus/ipn
 * 
 * 注意：Cryptomus 的回调可能通过不同方式发送
 * 这里处理静态钱包的充值回调
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求信息
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rawBody = await request.text();

    console.log('[Cryptomus IPN] Received callback');
    console.log('[Cryptomus IPN] IP:', ipAddress);
    console.log('[Cryptomus IPN] Body:', rawBody);

    // 解析请求体
    let payment;
    try {
      payment = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[Cryptomus IPN] Failed to parse body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 验证签名（可选，生产环境建议启用）
    // const isValid = await verifyWebhookSignature(ipAddress, payment);
    // if (!isValid) {
    //   console.error('[Cryptomus IPN] Invalid signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // 获取订单 ID
    const orderId = payment.order_id || payment.orderId;
    const status = payment.status;
    const amount = parseFloat(payment.amount || payment.paid_amount || '0');
    const walletUuid = payment.wallet_uuid || payment.walletUuid;

    if (!orderId) {
      console.error('[Cryptomus IPN] No order_id in payment');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    console.log('[Cryptomus IPN] Order ID:', orderId);
    console.log('[Cryptomus IPN] Status:', status);
    console.log('[Cryptomus IPN] Amount:', amount);
    console.log('[Cryptomus IPN] Wallet UUID:', walletUuid);

    // 查询充值记录
    const { data: recharge } = await supabaseRequest(`recharge?id=eq.${orderId}&select=*`, {
      method: 'GET',
    });

    if (!recharge || recharge.length === 0) {
      console.error('[Cryptomus IPN] Recharge not found:', orderId);
      return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });
    }

    const rechargeRecord = recharge[0];

    // 如果已经处理过，直接返回成功
    if (rechargeRecord.status === 'completed') {
      console.log('[Cryptomus IPN] Already processed:', orderId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 更新充值记录状态
    const newStatus = isPaymentCompleted(status)
      ? 'completed'
      : isPaymentFailed(status)
        ? 'rejected'
        : 'pending_confirm';

    await supabaseRequest(`recharge?id=eq.${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        cryptomusStatus: status,
        completedAt: isPaymentCompleted(status) ? new Date().toISOString() : null,
      }),
    });

    console.log('[Cryptomus IPN] Updated status to:', newStatus);

    // 如果支付完成，更新用户余额
    if (isPaymentCompleted(status)) {
      const userId = rechargeRecord.userId;
      const rechargeAmount = parseFloat(rechargeRecord.amount);

      // 更新余额
      const balanceUpdated = await updateUserBalance(userId, rechargeAmount);

      // 创建交易记录
      if (balanceUpdated) {
        await createTransaction(
          userId,
          rechargeAmount,
          `USDT 充值 - Cryptomus #${orderId}`
        );
      }

      console.log('[Cryptomus IPN] Balance updated for user:', userId, 'amount:', rechargeAmount);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cryptomus IPN] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyIpnSignature, PaymentStatus, isPaymentCompleted, isPaymentFailed } from '@/lib/nowpayments';

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
    console.error('[NowPayments] Update balance error:', error);
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
    console.error('[NowPayments] Create transaction error:', error);
    return false;
  }
}

/**
 * NowPayments IPN 回调处理
 * POST /api/recharge/nowpayments/ipn
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求体和签名
    const rawBody = await request.text();
    const signature = request.headers.get('x-nowpayments-sig') || '';

    console.log('[NowPayments IPN] Received callback');
    console.log('[NowPayments IPN] Signature:', signature);
    console.log('[NowPayments IPN] Body:', rawBody);

    // 验证签名（可选，生产环境建议启用）
    // const isValid = verifyIpnSignature(rawBody, signature);
    // if (!isValid) {
    //   console.error('[NowPayments IPN] Invalid signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const payment: PaymentStatus = JSON.parse(rawBody);

    // 获取订单 ID (即 recharge ID)
    const orderId = payment.order_id;
    if (!orderId) {
      console.error('[NowPayments IPN] No order_id in payment');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    console.log('[NowPayments IPN] Order ID:', orderId);
    console.log('[NowPayments IPN] Payment status:', payment.status);
    console.log('[NowPayments IPN] Pay amount:', payment.pay_amount);

    // 查询充值记录
    const { data: recharge } = await supabaseRequest(`recharge?id=eq.${orderId}&select=*`, {
      method: 'GET',
    });

    if (!recharge || recharge.length === 0) {
      console.error('[NowPayments IPN] Recharge not found:', orderId);
      return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });
    }

    const rechargeRecord = recharge[0];

    // 如果已经处理过，直接返回成功
    if (rechargeRecord.status === 'completed') {
      console.log('[NowPayments IPN] Already processed:', orderId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 更新充值记录状态
    const newStatus = isPaymentCompleted(payment) 
      ? 'completed' 
      : isPaymentFailed(payment) 
        ? 'rejected' 
        : 'pending_confirm';

    await supabaseRequest(`recharge?id=eq.${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        nowpaymentsStatus: payment.status,
        completedAt: isPaymentCompleted(payment) ? new Date().toISOString() : null,
      }),
    });

    console.log('[NowPayments IPN] Updated status to:', newStatus);

    // 如果支付完成，更新用户余额
    if (isPaymentCompleted(payment)) {
      const userId = rechargeRecord.userId;
      const amount = parseFloat(rechargeRecord.amount);

      // 更新余额
      const balanceUpdated = await updateUserBalance(userId, amount);

      // 创建交易记录
      if (balanceUpdated) {
        await createTransaction(
          userId, 
          amount, 
          `USDT 充值 - NowPayments #${payment.id}`
        );
      }

      console.log('[NowPayments IPN] Balance updated for user:', userId, 'amount:', amount);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NowPayments IPN] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

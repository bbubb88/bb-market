import { NextRequest, NextResponse } from 'next/server';
import { createPayment, CreatePaymentParams, getPaymentStatus, PaymentStatus } from '@/lib/nowpayments';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 获取站点 URL
const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://bb-market-next.vercel.app';

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=representation',
  };
  
  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>;
    if (optHeaders['Prefer']) {
      headers['Prefer'] = optHeaders['Prefer'];
    }
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

/**
 * 创建 NowPayments 充值
 * POST /api/recharge/nowpayments/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, orderIds } = body;

    if (!userId || !amount || amount < 5) {
      return NextResponse.json(
        { error: 'Invalid amount or user. Minimum is 5 USDT' },
        { status: 400 }
      );
    }

    const siteUrl = getSiteUrl();
    const rechargeId = 'rc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

    // 创建 NowPayments 支付
    const paymentParams: CreatePaymentParams = {
      price_amount: parseFloat(amount),
      price_currency: 'USDT',
      pay_currency: 'USDT',  // 接受 USDT 支付
      order_id: rechargeId,
      order_description: `BB Market Recharge - ${amount} USDT`,
      ipn_callback_url: `${siteUrl}/api/recharge/nowpayments/ipn`,
      // payout_address: 可选，指定收款地址
      // payout_currency: 可选，指定收款货币
    };

    console.log('[NowPayments] Creating payment:', paymentParams);

    const payment = await createPayment(paymentParams);

    if (!payment) {
      // 如果 NowPayments 失败，回退到手动转账模式
      console.warn('[NowPayments] Failed, falling back to manual mode');
      return NextResponse.json({
        fallback: true,
        amount: parseFloat(amount),
        address: process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS || 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh',
        message: 'NowPayments unavailable, please use manual transfer',
      });
    }

    // 保存充值记录到数据库
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30分钟有效期

    const rechargeData = {
      id: rechargeId,
      userId,
      amount: parseFloat(amount),
      address: payment.pay_address,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      nowpaymentsId: payment.id.toString(),
      nowpaymentsStatus: payment.status,
      payAmount: payment.pay_amount?.toString() || '',
      payCurrency: payment.pay_currency || 'USDT',
      orderIds: orderIds ? orderIds.join(',') : null,
    };

    try {
      await supabaseRequest('recharge', {
        method: 'POST',
        body: JSON.stringify(rechargeData),
      });
    } catch (dbError) {
      console.error('[NowPayments] Database error:', dbError);
    }

    // 返回给前端
    return NextResponse.json({
      id: rechargeId,
      amount: parseFloat(amount),
      address: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      nowpaymentsId: payment.id,
      status: payment.status,
      expiresAt: expiresAt.toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${payment.pay_address}?amount=${payment.pay_amount}&color=ffffff&bgcolor=1a1a2e`,
    });
  } catch (error) {
    console.error('[NowPayments] Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

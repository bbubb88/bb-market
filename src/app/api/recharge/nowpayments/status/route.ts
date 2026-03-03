import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus, PaymentStatus, isPaymentCompleted, isPaymentFailed } from '@/lib/nowpayments';

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
 * 查询充值状态
 * GET /api/recharge/nowpayments/status?rechargeId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rechargeId = searchParams.get('rechargeId');

    if (!rechargeId) {
      return NextResponse.json(
        { error: 'Missing rechargeId' },
        { status: 400 }
      );
    }

    // 从数据库获取充值记录
    const { data: recharge } = await supabaseRequest(`recharge?id=eq.${rechargeId}&select=*`, {
      method: 'GET',
    });

    if (!recharge || recharge.length === 0) {
      return NextResponse.json(
        { error: 'Recharge not found' },
        { status: 404 }
      );
    }

    const record = recharge[0];

    // 如果有 NowPayments ID，同步查询最新状态
    if (record.nowpaymentsId) {
      const paymentStatus = await getPaymentStatus(parseInt(record.nowpaymentsId));

      if (paymentStatus) {
        // 更新数据库状态
        const newStatus = isPaymentCompleted(paymentStatus) 
          ? 'completed' 
          : isPaymentFailed(paymentStatus) 
            ? 'rejected' 
            : record.status;

        // 如果状态变化且是完成状态，更新余额
        if (isPaymentCompleted(paymentStatus) && record.status !== 'completed') {
          // 更新充值记录
          await supabaseRequest(`recharge?id=eq.${rechargeId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              status: newStatus,
              nowpaymentsStatus: paymentStatus.status,
              completedAt: new Date().toISOString(),
            }),
          });

          // 更新用户余额
          const { data: userData } = await supabaseRequest(`user?id=eq.${record.userId}&select=balance`, {
            method: 'GET',
          });

          const currentBalance = userData?.[0]?.balance || 0;
          const newBalance = currentBalance + parseFloat(record.amount);

          try {
            await supabaseRequest(`user?id=eq.${record.userId}`, {
              method: 'PATCH',
              body: JSON.stringify({ balance: newBalance }),
            });

            // 创建交易记录
            await supabaseRequest('transaction', {
              method: 'POST',
              body: JSON.stringify({
                userId: record.userId,
                type: 'recharge',
                amount: parseFloat(record.amount),
                status: 'completed',
                description: `USDT 充值 - NowPayments #${paymentStatus.id}`,
              }),
            });
          } catch (e) {
            console.error('[NowPayments] Update balance error:', e);
          }

          return NextResponse.json({
            id: record.id,
            status: newStatus,
            nowpaymentsStatus: paymentStatus.status,
            amount: record.amount,
            completedAt: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          id: record.id,
          status: newStatus,
          nowpaymentsStatus: paymentStatus.status,
          amount: record.amount,
        });
      }
    }

    // 返回本地状态
    return NextResponse.json({
      id: record.id,
      status: record.status,
      nowpaymentsStatus: record.nowpaymentsStatus,
      amount: record.amount,
    });
  } catch (error) {
    console.error('[NowPayments] Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

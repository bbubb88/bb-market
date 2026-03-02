import { NextRequest, NextResponse } from 'next/server';

// 使用 Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': options.headers?.['Prefer'] || 'return=representation',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

// 管理员确认充值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rechargeId, action } = body; // action: 'approve' | 'reject'

    if (!rechargeId || !action) {
      return NextResponse.json(
        { error: 'Recharge ID and action required' },
        { status: 400 }
      );
    }

    // 先获取充值记录
    const { status: getStatus, data: rechargeData } = await supabaseRequest(
      `recharge?id=eq.${rechargeId}&select=*`
    );

    if (getStatus >= 400 || !rechargeData || rechargeData.length === 0) {
      return NextResponse.json(
        { error: 'Recharge record not found' },
        { status: 404 }
      );
    }

    const recharge = rechargeData[0];

    if (action === 'approve') {
      // 更新充值状态为已完成
      const { status: updateStatus } = await supabaseRequest(
        `recharge?id=eq.${rechargeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed',
            completedAt: new Date().toISOString(),
          }),
        }
      );

      if (updateStatus >= 400) {
        return NextResponse.json(
          { error: 'Failed to update recharge status' },
          { status: 500 }
        );
      }

      // 获取当前用户余额
      const { status: userStatus, data: userData } = await supabaseRequest(
        `user?id=eq.${recharge.userId}&select=balance`
      );

      let newBalance = recharge.amount;
      if (userStatus === 200 && userData && userData.length > 0) {
        newBalance = (userData[0].balance || 0) + recharge.amount;
      }

      // 更新用户余额
      const { status: balanceStatus } = await supabaseRequest(
        `user?id=eq.${recharge.userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            balance: newBalance,
          }),
        }
      );

      if (balanceStatus >= 400) {
        console.error('Failed to update user balance');
      }

      // 创建交易记录
      await supabaseRequest('transaction', {
        method: 'POST',
        body: JSON.stringify({
          userId: recharge.userId,
          type: 'deposit',
          amount: recharge.amount,
          status: 'completed',
          description: `USDT 充值 - ${recharge.amount} USDT`,
          createdAt: new Date().toISOString(),
        }),
      });

      return NextResponse.json({
        success: true,
        message: 'Recharge approved and balance updated',
        newBalance,
      });

    } else if (action === 'reject') {
      // 拒绝充值
      const { status: updateStatus } = await supabaseRequest(
        `recharge?id=eq.${rechargeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'rejected',
            completedAt: new Date().toISOString(),
          }),
        }
      );

      if (updateStatus >= 400) {
        return NextResponse.json(
          { error: 'Failed to update recharge status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Recharge rejected',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

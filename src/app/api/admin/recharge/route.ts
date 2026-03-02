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

// 管理员获取所有待处理的充值
export async function GET() {
  try {
    const { status, data } = await supabaseRequest(
      'recharge?status=eq.pending_confirm&select=*&order=createdAt.desc'
    );

    if (status >= 400) {
      console.error('Supabase error:', data);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Admin list error:', error);
    return NextResponse.json([]);
  }
}

// 管理员确认或拒绝充值
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rechargeId, action, adminKey } = body;

    // 简单的管理员验证（生产环境应该使用更安全的方式）
    const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'bbmarket_admin_2024';
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rechargeId || !action) {
      return NextResponse.json(
        { error: 'Recharge ID and action required' },
        { status: 400 }
      );
    }

    // 获取充值记录
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
      await supabaseRequest(
        `recharge?id=eq.${rechargeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed',
            completedAt: new Date().toISOString(),
          }),
        }
      );

      // 获取并更新用户余额
      const { status: userStatus, data: userData } = await supabaseRequest(
        `user?id=eq.${recharge.userId}&select=id,balance`
      );

      let newBalance = recharge.amount;
      if (userStatus === 200 && userData && userData.length > 0) {
        const user = userData[0];
        newBalance = (parseFloat(user.balance) || 0) + parseFloat(recharge.amount);
        
        await supabaseRequest(
          `user?id=eq.${recharge.userId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              balance: newBalance,
            }),
          }
        );
      }

      // 创建交易记录
      await supabaseRequest('transaction', {
        method: 'POST',
        body: JSON.stringify({
          userId: recharge.userId,
          type: 'deposit',
          amount: parseFloat(recharge.amount),
          status: 'completed',
          description: `USDT 充值 - ${recharge.amount} USDT (管理员确认)`,
          createdAt: new Date().toISOString(),
        }),
      });

      return NextResponse.json({
        success: true,
        message: 'Recharge approved and balance updated',
        newBalance,
      });

    } else if (action === 'reject') {
      await supabaseRequest(
        `recharge?id=eq.${rechargeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'rejected',
            completedAt: new Date().toISOString(),
          }),
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Recharge rejected',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Admin confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

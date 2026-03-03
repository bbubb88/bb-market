import { NextRequest, NextResponse } from 'next/server';

// 使用 Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytsqawvrgzxgfluuadao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

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
 * 管理员确认充值 API v2
 * 充值资金进入托管账户（不在平台账户）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rechargeId, action, depositId } = body;

    // 支持两种参数：rechargeId（旧接口兼容）或 depositId（新接口）
    const targetId = depositId || rechargeId;
    const table = depositId ? 'EscrowDeposit' : 'recharge';

    if (!targetId || !action) {
      return NextResponse.json(
        { error: 'ID and action required' },
        { status: 400 }
      );
    }

    // 获取充值记录
    const { status: getStatus, data: records } = await supabaseRequest(
      `${table}?id=eq.${targetId}&select=*`
    );

    if (getStatus >= 400 || !records || records.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    const record = records[0];

    if (action === 'approve') {
      const now = new Date().toISOString();

      // 更新充值状态为已完成
      await supabaseRequest(`${table}?id=eq.${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'CONFIRMED',
          confirmedAt: now,
        }),
      });

      // 获取或创建用户钱包
      let { status: walletStatus, data: wallets } = await supabaseRequest(
        `Wallet?userId=eq.${record.userId}&select=*`
      );

      let wallet;
      if (walletStatus !== 200 || !wallets || wallets.length === 0) {
        const { data: newWallets } = await supabaseRequest('Wallet', {
          method: 'POST',
          body: JSON.stringify({
            userId: record.userId,
            balance: 0,
            escrowBalance: 0,
            locked: 0,
          }),
        });
        wallet = newWallets[0];
      } else {
        wallet = wallets[0];
      }

      // 资金进入托管余额（不在平台账户）
      const currentEscrow = parseFloat(wallet.escrowBalance || '0');
      
      await supabaseRequest(`Wallet?id=eq.${wallet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          escrowBalance: currentEscrow + record.amount,
          updatedAt: now,
        }),
      });

      // 记录交易
      await supabaseRequest('EscrowTransaction', {
        method: 'POST',
        body: JSON.stringify({
          userId: record.userId,
          type: 'DEPOSIT',
          amount: record.amount,
          status: 'COMPLETED',
          description: `托管充值确认 - ${record.amount} USDT`,
          createdAt: now,
        }),
      });

      return NextResponse.json({
        success: true,
        message: 'Recharge confirmed - funds in escrow',
        escrowBalance: currentEscrow + record.amount,
      });

    } else if (action === 'reject') {
      await supabaseRequest(`${table}?id=eq.${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'FAILED',
          confirmedAt: new Date().toISOString(),
        }),
      });

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

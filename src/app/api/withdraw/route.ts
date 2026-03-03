import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// 平台配置
const PLATFORM_WALLET = 'TXqY4K3QvJk9xLm2nP7rT8sUw5xYz6Gh'; // 平台收款地址 (TRC20)
const WITHDRAWAL_FEE_PERCENT = 5; // 提现手续费 5%

async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation',
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`,  });
  const {
    ...options data = await res,
    headers,
.json();
  return.status, data };
 { status: res}

/**
 * 提现 API
完整现流程:
 *提 1. 用户发起 * 
 * 提现请求
 * 2. 验证余额和地址
 * 3. 计算手续费 (5%)
 * 4. 扣除提现记录
 * 5余额，创建. 记录交易流水
 * 6. (异步) 处理 TRC20 转账
 * 
 * 手续费说明:
 * - 5%  提现收取手续费
 * -平台所有
 * 手续费归 - 实际到账 =提现金额 -  手续费
 */

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, address, addressType = 'TRC20' } = await request.json();

    // 验证必填字段
    if (!userId || !amount || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, address' },
        { status: 400 }
      );
    }

    // 验证金额
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // 验证地址格式 (TRC20 地址以 T 开头，长度 34 位)
    if (addressType === 'TRC20') {
      if (!address.startsWith('T') || address.length < 34) {
        return NextResponse.json(
          { error: 'Invalid TRC20 address format' },
          { status: 400 }
        );
      }
    }

    // 获取用户钱包
    const { status: walletStatus, data: wallets } = await supabaseRequest(
      `Wallet?userId=eq.${userId}&select=*`
    );

    if (walletStatus !== 200 || !wallets || wallets.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const wallet = wallets[0];
    const currentBalance = parseFloat(wallet.balance || '0');

    // 检查余额是否充足 (可用于提现的余额)
    // 注意: 冻结余额 frozen 和锁定余额 locked 不能直接提现
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          balance: currentBalance,
          frozen: wallet.frozen || 0,
          locked: wallet.locked || 0,
          available: currentBalance,
          requested: amount,
        },
        { status: 400 }
      );
    }

    // 计算手续费 (5%)
    const fee = Math.round(amount * WITHDRAWAL_FEE_PERCENT / 100 * 100) / 100;
    const netAmount = Math.round((amount - fee) * 100) / 100;

    // 验证计算正确性
    if (netAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount too small after fee deduction' },
        { status: 400 }
      );
    }

    // 创建提现记录 (状态: PENDING)
    const { status: createStatus, data: withdrawals } = await supabaseRequest('Withdrawal', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: amount,      // 用户申请提现的金额
        fee: fee,           // 手续费
        netAmount: netAmount, // 实际到账金额
        address: address,   // 提现地址
        addressType: addressType,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }),
    });

    if (createStatus >= 400) {
      console.error('Failed to create withdrawal record:', withdrawals);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    const withdrawal = withdrawals[0];

    // 扣除用户余额
    const newBalance = currentBalance - amount;
    
    const { status: updateStatus } = await supabaseRequest(
      `Wallet?id=eq.${wallet.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          balance: newBalance,
          updatedAt: new Date().toISOString(),
        }),
      }
    );

    if (updateStatus >= 400) {
      // 回滚提现记录状态
      await supabaseRequest(`Withdrawal?id=eq.${withdrawal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'FAILED',
          errorMessage: 'Failed to update wallet balance',
        }),
      });
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      );
    }

    // 记录用户端的交易流水
    await supabaseRequest('EscrowTransaction', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type: 'WITHDRAWAL',
        amount: -amount,  // 负数表示支出
        fee: fee,
        status: 'COMPLETED',
        description: `申请提现 ${amount} USDT 到 ${address.substring(0, 8)}...${address.substring(address.length - 6)} (手续费 ${fee} USDT，实际到账 ${netAmount} USDT)`,
        createdAt: new Date().toISOString(),
      }),
    });

    // 记录平台的手续费收入
    await supabaseRequest('EscrowTransaction', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'PLATFORM',
        type: 'WITHDRAWAL_FEE',
        amount: fee,
        status: 'COMPLETED',
        description: `提现手续费收入 ${fee} USDT (用户: ${userId})`,
        createdAt: new Date().toISOString(),
      }),
    });

    // TODO: 在生产环境中，这里应该调用异步任务处理实际的 TRC20 转账
    // 示例:
    // await processWithdrawalAsync(withdrawal.id, address, netAmount);
    
    // 模拟: 立即更新为处理中状态
    await supabaseRequest(`Withdrawal?id=eq.${withdrawal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'PROCESSING',
        processedAt: new Date().toISOString(),
      }),
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal.id,
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      address: address,
      status: 'PROCESSING',
      message: `提现申请已提交\n\n提现金额: ${amount} USDT\n手续费 (5%): ${fee} USDT\n实际到账: ${netAmount} USDT\n\n预计 1-3 个工作日内到账`,
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - 查询提现记录
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const withdrawalId = searchParams.get('withdrawalId');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    if (withdrawalId) {
      // 查询单条提现记录
      const { status, data } = await supabaseRequest(
        `Withdrawal?id=eq.${withdrawalId}&select=*`
      );

      if (status !== 200) {
        return NextResponse.json(
          { error: 'Failed to query withdrawal' },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'Withdrawal not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data[0]);
    }

    if (userId) {
      // 查询用户的提现记录
      const { status, data } = await supabaseRequest(
        `Withdrawal?userId=eq.${userId}&order=createdAt.desc&limit=${limit}`
      );

      if (status !== 200) {
        return NextResponse.json(
          { error: 'Failed to query withdrawals' },
          { status: 500 }
        );
      }

      // 统计
      const { data: stats } = await supabaseRequest(
        `Withdrawal?userId=eq.${userId}&select=amount,fee,netAmount,status`
      );

      const totalWithdrawn = stats
        ?.filter((w: any) => w.status === 'COMPLETED')
        ?.reduce((sum: number, w: any) => sum + parseFloat(w.netAmount || '0'), 0) || 0;

      const totalFees = stats
        ?.filter((w: any) => w.status === 'COMPLETED')
        ?.reduce((sum: number, w: any) => sum + parseFloat(w.fee || '0'), 0) || 0;

      return NextResponse.json({
        withdrawals: data || [],
        summary: {
          totalWithdrawn,
          totalFees,
          count: stats?.length || 0,
        },
      });
    }

    return NextResponse.json(
      { error: 'Missing userId or withdrawalId' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

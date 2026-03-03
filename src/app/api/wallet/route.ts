import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * 钱包 API v2
 * 支持余额、托管余额、提现
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  try {
    let walletRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?userId=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    const wallets = await walletRes.json();
    
    let wallet;
    
    if (!wallets || wallets.length === 0) {
      // 创建新钱包
      const createWalletRes = await fetch(`${SUPABASE_URL}/rest/v1/Wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          userId,
          balance: 0,
          escrowBalance: 0,
          locked: 0,
        }),
      });
      
      const newWallets = await createWalletRes.json();
      wallet = newWallets[0] || { balance: 0, escrowBalance: 0, locked: 0 };
    } else {
      wallet = wallets[0];
    }

    // 获取交易记录
    let transactions = [];
    try {
      const txRes = await fetch(
        `${SUPABASE_URL}/rest/v1/EscrowTransaction?userId=eq.${userId}&order=createdAt.desc&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      transactions = await txRes.json() || [];
    } catch (e) {
      console.log('Transaction table may not exist');
    }

    return NextResponse.json({
      balance: wallet.balance || 0,
      escrowBalance: wallet.escrowBalance || 0,
      locked: wallet.locked || 0,
      availableBalance: wallet.balance || 0, // 可提现余额
      transactions: transactions || [],
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 提现
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, address } = await request.json();

    if (!userId || !amount || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, address' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // 验证 TRC20 地址格式
    if (!address.startsWith('T')) {
      return NextResponse.json(
        { error: 'Invalid TRC20 address format' },
        { status: 400 }
      );
    }

    // 获取钱包
    let walletRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?userId=eq.${userId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    let wallets = await walletRes.json();
    
    if (!wallets || wallets.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const wallet = wallets[0];
    const currentBalance = parseFloat(wallet.balance || '0');

    // 验证余额
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance', balance: currentBalance, required: amount },
        { status: 400 }
      );
    }

    const WITHDRAWAL_FEE_RATE = 0.05;
    const fee = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
    const actualAmount = Math.round((amount - fee) * 100) / 100;

    const now = new Date().toISOString();

    // 创建提现记录
    const withdrawRes = await fetch(`${SUPABASE_URL}/rest/v1/Withdrawal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        userId,
        amount: amount,
        fee: fee,
        actualAmount: actualAmount,
        address: address,
        status: 'PENDING',
        createdAt: now,
      }),
    });

    const withdrawal = await withdrawRes.json();

    if (!withdrawRes.ok) {
      console.error('Failed to create withdrawal:', withdrawal);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    // 冻结余额
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?id=eq.${wallet.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ 
          balance: currentBalance - amount,
          locked: (wallet.locked || 0) + amount,
          updatedAt: now,
        }),
      }
    );

    // 记录交易
    await fetch(`${SUPABASE_URL}/rest/v1/EscrowTransaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        userId,
        type: 'WITHDRAW',
        amount: -amount,
        fee: fee,
        status: 'PENDING',
        description: `提现申请 - ${amount} USDT（手续费 ${fee} USDT，实际到账 ${actualAmount} USDT）`,
        createdAt: now,
      }),
    });

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal[0]?.id || withdrawal.id,
      amount: amount,
      fee: fee,
      actualAmount: actualAmount,
      address: address,
      status: 'PENDING',
      message: '提现申请已提交，等待处理'
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

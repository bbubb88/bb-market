import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * 钱包 API v2
 * 支持余额、冻结余额、提现
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
      // 创建新钱包 - 只使用 balance 和 frozen 字段
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
          frozen: 0,
        }),
      });
      
      const newWallets = await createWalletRes.json();
      wallet = newWallets[0] || { balance: 0, frozen: 0 };
    } else {
      wallet = wallets[0];
    }

    // 获取交易记录 - 使用 Order 表
    let transactions = [];
    try {
      const txRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Order?or=(buyerId.eq.${userId},sellerId.eq.${userId})&order=createdAt.desc&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const orders = await txRes.json() || [];
      
      // 将订单转换为交易记录格式
      transactions = orders.map((order: any) => ({
        id: order.id,
        type: order.buyerId === userId ? 'buy' : 'sell',
        amount: parseFloat(order.price),
        status: order.status?.toLowerCase() || 'pending',
        createdAt: order.createdAt,
        description: order.buyerId === userId ? '购买商品' : '出售商品'
      }));
    } catch (e) {
      console.log('Transaction query error:', e);
    }

    const balance = parseFloat(wallet.balance || '0');
    const frozen = parseFloat(wallet.frozen || '0');

    return NextResponse.json({
      balance: balance,
      escrowBalance: 0,
      locked: frozen,
      availableBalance: balance - frozen,
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

    // 检查 Withdrawal 表是否存在，不存在则跳过
    let withdrawal = null;
    try {
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

      withdrawal = await withdrawRes.json();
    } catch (e) {
      console.log('Withdrawal table not available, skipping record creation');
    }

    // 冻结余额 - 使用 frozen 字段
    const currentFrozen = parseFloat(wallet.frozen || '0');
    await fetch(
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
          balance: (currentBalance - amount).toString(),
          frozen: (currentFrozen + amount).toString(),
          updatedAt: now,
        }),
      }
    );

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal?.[0]?.id || withdrawal?.id || 'pending',
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

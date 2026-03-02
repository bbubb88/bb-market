import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// 获取钱包信息
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
          frozen: 0,
        }),
      });
      
      const newWallets = await createWalletRes.json();
      wallet = newWallets[0];
    } else {
      wallet = wallets[0];
    }

    // 获取交易记录 (optional - if Transaction table exists)
    let transactions = [];
    try {
      const txRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Transaction?userId=eq.${userId}&order=createdAt.desc&limit=20`,
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
      balance: wallet?.balance || 0,
      frozen: wallet?.frozen || 0,
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

// 充值
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, type } = await request.json();

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, type' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // 获取或创建钱包
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
          frozen: 0,
        }),
      });
      
      const newWallets = await createWalletRes.json();
      wallet = newWallets[0];
    } else {
      wallet = wallets[0];
    }

    const currentBalance = parseFloat(wallet.balance || '0');
    const newBalance = type === 'deposit' 
      ? currentBalance + amount 
      : Math.max(0, currentBalance - amount);

    // 更新钱包
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
          balance: newBalance,
          updatedAt: new Date().toISOString(),
        }),
      }
    );

    const updatedWallet = await updateRes.json();

    if (!updateRes.ok) {
      return NextResponse.json(
        { error: 'Failed to update wallet' },
        { status: 500 }
      );
    }

    // 记录交易 (optional - if Transaction table exists)
    try {
      const now = new Date().toISOString();
      const transactionData = {
        userId,
        type: type.toUpperCase(),
        amount: type === 'deposit' ? amount : -amount,
        status: 'COMPLETED',
        description: type === 'deposit' ? '充值' : '提现',
        createdAt: now,
      };

      await fetch(`${SUPABASE_URL}/rest/v1/Transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(transactionData),
      });
    } catch (e) {
      console.log('Transaction recording skipped - table may not exist');
    }

    return NextResponse.json({
      success: true,
      balance: newBalance,
    });

  } catch (error) {
    console.error('Wallet operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// 支付 API - 从钱包扣款并更新订单状态
export async function POST(request: NextRequest) {
  try {
    const { orderIds, userId, totalAmount } = await request.json();

    if (!orderIds || !userId || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderIds, userId, totalAmount' },
        { status: 400 }
      );
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'orderIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // 1. 获取用户钱包信息
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
      if (!createWalletRes.ok) {
        console.error('Failed to create wallet:', newWallets);
        return NextResponse.json(
          { error: 'Failed to initialize wallet' },
          { status: 500 }
        );
      }
      wallet = newWallets[0];
    } else {
      wallet = wallets[0];
    }

    const currentBalance = parseFloat(wallet.balance || '0');

    // 2. 验证余额是否充足
    if (currentBalance < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance', currentBalance, required: totalAmount },
        { status: 400 }
      );
    }

    // 3. 获取订单信息验证
    const orderIdsStr = orderIds.join(',');
    const ordersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?id=in.(${orderIdsStr})&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    const orders = await ordersRes.json();
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders found' },
        { status: 404 }
      );
    }

    // 验证所有订单都属于该用户
    for (const order of orders) {
      if (order.buyerId !== userId) {
        return NextResponse.json(
          { error: 'Order does not belong to user' },
          { status: 403 }
        );
      }
      if (order.status !== 'PENDING') {
        return NextResponse.json(
          { error: `Order ${order.id} is not pending` },
          { status: 400 }
        );
      }
    }

    // 4. 扣款 - 更新钱包余额
    const newBalance = Math.round((currentBalance - totalAmount) * 100) / 100;
    
    const updateWalletRes = await fetch(
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

    const updatedWallet = await updateWalletRes.json();

    if (!updateWalletRes.ok) {
      console.error('Failed to update wallet balance:', updatedWallet);
      return NextResponse.json(
        { error: 'Failed to deduct balance' },
        { status: 500 }
      );
    }

    // 5. 更新订单状态为 PAID
    const now = new Date().toISOString();
    const updateOrdersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?id=in.(${orderIdsStr})`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          status: 'PAID',
          updatedAt: now,
          paidAt: now,
        }),
      }
    );

    const updatedOrders = await updateOrdersRes.json();

    if (!updateOrdersRes.ok) {
      console.error('Failed to update orders:', updatedOrders);
      return NextResponse.json(
        { error: 'Failed to update order status', balanceDeducted: true },
        { status: 500 }
      );
    }

    // 6. 记录交易历史 (optional - if Transaction table exists)
    try {
      for (const order of orders) {
        const transactionData = {
          userId,
          orderId: order.id,
          type: 'BUY',
          amount: -order.price,
          fee: -order.fee,
          totalAmount: -(order.price + order.fee),
          status: 'COMPLETED',
          description: `购买商品 #${order.listingId}`,
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
      }
    } catch (e) {
      console.log('Transaction recording skipped - table may not exist');
    }

    return NextResponse.json({
      success: true,
      message: 'Payment successful',
      newBalance,
      paidOrders: updatedOrders,
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取用户钱包余额
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
      return NextResponse.json({
        balance: 0,
        frozen: 0,
      });
    }

    return NextResponse.json({
      balance: wallets[0].balance || 0,
      frozen: wallets[0].frozen || 0,
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

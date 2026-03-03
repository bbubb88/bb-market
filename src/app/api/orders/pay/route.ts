import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * 订单支付 API v2
 * 使用托管余额支付
 */
export async function POST(request: NextRequest) {
  try {
    const { orderIds, userId, totalAmount, useEscrow = true } = await request.json();

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
          escrowBalance: 0,
          locked: 0,
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

    let currentEscrowBalance = parseFloat(wallet.escrowBalance || '0');
    let currentBalance = parseFloat(wallet.balance || '0');

    if (useEscrow) {
      // 使用托管余额支付（资金在第三方托管）
      if (currentEscrowBalance < totalAmount) {
        return NextResponse.json(
          { 
            error: 'Insufficient escrow balance', 
            escrowBalance: currentEscrowBalance, 
            required: totalAmount,
            tip: 'Please deposit USDT to escrow first'
          },
          { status: 400 }
        );
      }

      // 减少托管余额，增加锁定金额
      const newEscrowBalance = Math.round((currentEscrowBalance - totalAmount) * 100) / 100;
      const currentLocked = parseFloat(wallet.locked || '0');
      const newLocked = currentLocked + totalAmount;

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
            escrowBalance: newEscrowBalance,
            locked: newLocked,
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      const updatedWallet = await updateWalletRes.json();

      if (!updateWalletRes.ok) {
        console.error('Failed to update wallet:', updatedWallet);
        return NextResponse.json(
          { error: 'Failed to lock funds' },
          { status: 500 }
        );
      }

      // 为每个订单创建托管锁定记录
      const now = new Date().toISOString();
      for (const orderId of orderIds) {
        // 获取订单金额
        const orderRes = await fetch(
          `${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const orders = await orderRes.json();
        
        if (orders && orders.length > 0) {
          const order = orders[0];
          const orderTotal = order.price + (order.fee || 0);

          // 创建托管锁定记录
          await fetch(`${SUPABASE_URL}/rest/v1/EscrowLock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              orderId: orderId,
              buyerId: userId,
              amount: order.price,
              fee: order.fee || 0,
              totalAmount: orderTotal,
              status: 'LOCKED',
              createdAt: now,
            }),
          });

          // 记录托管交易
          await fetch(`${SUPABASE_URL}/rest/v1/EscrowTransaction`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              userId: userId,
              orderId: orderId,
              type: 'LOCK',
              amount: orderTotal,
              status: 'COMPLETED',
              description: `订单支付锁定 - ${orderTotal} USDT`,
              createdAt: now,
            }),
          });
        }
      }

    } else {
      // 使用普通可用余额支付（不支持，因为资金不在平台账户）
      return NextResponse.json(
        { 
          error: 'Direct balance payment not supported', 
          message: 'Please use escrow balance for payment',
          tip: 'All payments must go through escrow for security'
        },
        { status: 400 }
      );
    }

    // 2. 获取订单信息验证
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

    // 3. 更新订单状态为 PAID
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
          escrowStatus: 'LOCKED',
          escrowLockedAt: now,
        }),
      }
    );

    const updatedOrders = await updateOrdersRes.json();

    if (!updateOrdersRes.ok) {
      console.error('Failed to update orders:', updatedOrders);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // 4. 获取更新后的钱包信息
    const finalWalletRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?id=eq.${wallet.id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const finalWallet = await finalWalletRes.json();

    return NextResponse.json({
      success: true,
      message: 'Payment successful - funds locked in escrow',
      escrow: true,
      escrowBalance: finalWallet[0]?.escrowBalance || 0,
      locked: finalWallet[0]?.locked || 0,
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
      return NextResponse.json({
        balance: 0,
        escrowBalance: 0,
        locked: 0,
      });
    }

    return NextResponse.json({
      balance: wallets[0].balance || 0,
      escrowBalance: wallets[0].escrowBalance || 0,
      locked: wallets[0].locked || 0,
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

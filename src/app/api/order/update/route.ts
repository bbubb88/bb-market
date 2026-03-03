import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * 订单状态更新 API v2
 * 支持托管资金释放和退款
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, status, userId, releaseEscrow = true } = await request.json();

    if (!orderId || !status || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 获取订单信息
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
    
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // 验证权限
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 状态转换验证
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['PAID', 'CANCELLED'],
      'PAID': ['COMPLETED', 'CANCELLED'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    // 更新订单
    const updateData: any = { 
      status,
      updatedAt: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    let escrowAction = null;

    // 处理订单完成 - 释放托管资金给卖家
    if (status === 'COMPLETED') {
      updateData.completedAt = now;
      updateData.escrowStatus = 'RELEASED';
      updateData.escrowReleasedAt = now;

      // 如果订单使用托管，释放资金给卖家
      if (releaseEscrow && order.escrowStatus === 'LOCKED') {
        escrowAction = await releaseEscrowFunds(orderId, order.sellerId, order.buyerId, order.price, order.fee || 0);
      }
    }

    // 处理订单取消 - 退款给买家（原路返回）
    if (status === 'CANCELLED' && order.escrowStatus === 'LOCKED') {
      updateData.escrowStatus = 'REFUNDED';
      
      // 退款给买家
      escrowAction = await refundEscrowFunds(orderId, order.buyerId, order.price, order.fee || 0);
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      }
    );

    const updatedOrder = await updateRes.json();

    if (!updateRes.ok) {
      return NextResponse.json(
        { error: updatedOrder.message || 'Failed to update order' },
        { status: updateRes.status }
      );
    }

    // 如果订单完成或取消，更新商品状态
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await fetch(
        `${SUPABASE_URL}/rest/v1/Listing?id=eq.${order.listingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ 
            status: status === 'COMPLETED' ? 'SOLD' : 'SELLING' 
          }),
        }
      );
    }

    return NextResponse.json({
      ...(updatedOrder[0] || updatedOrder),
      escrowAction: escrowAction,
    });

  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 释放托管资金给卖家
async function releaseEscrowFunds(orderId: string, sellerId: string, buyerId: string, price: number, fee: number) {
  const totalAmount = price + fee;
  const now = new Date().toISOString();

  try {
    // 1. 获取买家钱包，减少锁定金额
    const buyerWalletRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?userId=eq.${buyerId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const buyerWallets = await buyerWalletRes.json();
    
    if (buyerWallets && buyerWallets.length > 0) {
      const buyerWallet = buyerWallets[0];
      const buyerLocked = parseFloat(buyerWallet.locked || '0');
      
      await fetch(`${SUPABASE_URL}/rest/v1/Wallet?id=eq.${buyerWallet.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          locked: Math.max(0, buyerLocked - totalAmount),
          updatedAt: now,
        }),
      });
    }

    // 2. 更新托管锁定记录
    await fetch(`${SUPABASE_URL}/rest/v1/EscrowLock?orderId=eq.${orderId}&status=eq.LOCKED`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        status: 'RELEASED',
        releasedAt: now,
      }),
    });

    // 3. 获取或创建卖家钱包，转入资金（资金进入平台，转给卖家）
    let sellerWalletRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?userId=eq.${sellerId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    let sellerWallets = await sellerWalletRes.json();

    if (!sellerWallets || sellerWallets.length === 0) {
      // 创建卖家钱包
      await fetch(`${SUPABASE_URL}/rest/v1/Wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          userId: sellerId,
          balance: price, // 卖家收到商品价格（不含手续费）
          escrowBalance: 0,
          locked: 0,
        }),
      });
    } else {
      const sellerWallet = sellerWallets[0];
      const sellerBalance = parseFloat(sellerWallet.balance || '0');
      
      await fetch(`${SUPABASE_URL}/rest/v1/Wallet?id=eq.${sellerWallet.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          balance: sellerBalance + price,
          updatedAt: now,
        }),
      });
    }

    // 4. 记录资金释放交易
    await fetch(`${SUPABASE_URL}/rest/v1/EscrowTransaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        userId: sellerId,
        orderId: orderId,
        type: 'RELEASE',
        amount: price,
        fee: fee,
        status: 'COMPLETED',
        description: `订单完成 - 收入 ${price} USDT`,
        createdAt: now,
      }),
    });

    // 5. 记录平台手续费
    if (fee > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/EscrowTransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          userId: 'PLATFORM',
          orderId: orderId,
          type: 'FEE',
          amount: fee,
          status: 'COMPLETED',
          description: `交易手续费`,
          createdAt: now,
        }),
      });
    }

    return {
      action: 'release',
      amount: price,
      fee: fee,
      message: '资金已释放给卖家'
    };
  } catch (error) {
    console.error('Error releasing escrow funds:', error);
    return { error: 'Failed to release funds' };
  }
}

// 退款给买家（原路返回）
async function refundEscrowFunds(orderId: string, buyerId: string, price: number, fee: number) {
  const totalAmount = price + fee;
  const now = new Date().toISOString();

  try {
    // 1. 获取买家钱包
    const buyerWalletRes = await fetch(
      `${SUPABASE_URL}/rest/v1/Wallet?userId=eq.${buyerId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const buyerWallets = await buyerWalletRes.json();
    
    if (buyerWallets && buyerWallets.length > 0) {
      const buyerWallet = buyerWallets[0];
      const buyerLocked = parseFloat(buyerWallet.locked || '0');
      const buyerEscrow = parseFloat(buyerWallet.escrowBalance || '0');
      
      // 锁定金额转回托管余额（原路返回）
      await fetch(`${SUPABASE_URL}/rest/v1/Wallet?id=eq.${buyerWallet.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          locked: Math.max(0, buyerLocked - totalAmount),
          escrowBalance: buyerEscrow + totalAmount,
          updatedAt: now,
        }),
      });
    }

    // 2. 更新托管锁定记录
    await fetch(`${SUPABASE_URL}/rest/v1/EscrowLock?orderId=eq.${orderId}&status=eq.LOCKED`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        status: 'REFUNDED',
        releasedAt: now,
      }),
    });

    // 3. 记录退款交易
    await fetch(`${SUPABASE_URL}/rest/v1/EscrowTransaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        userId: buyerId,
        orderId: orderId,
        type: 'REFUND',
        amount: totalAmount,
        status: 'COMPLETED',
        description: `订单取消 - 退款 ${totalAmount} USDT（原路返回）`,
        createdAt: now,
      }),
    });

    return {
      action: 'refund',
      amount: totalAmount,
      message: '资金已原路退回给买家'
    };
  } catch (error) {
    console.error('Error refunding escrow funds:', error);
    return { error: 'Failed to refund' };
  }
}
